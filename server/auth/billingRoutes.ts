import type { Express } from "express";
import { storage } from "../storage";
import { authenticate } from "./independentAuth";

function getPublishedDomain(req: any): string {
  const appUrl = process.env.APP_URL;
  if (appUrl) {
    if (appUrl.startsWith("http://") || appUrl.startsWith("https://")) {
      return appUrl;
    }
    return `https://${appUrl}`;
  }

  // Try Replit domain first
  const replitDomains = process.env.REPLIT_DOMAINS;
  if (replitDomains) {
    const domains = replitDomains.split(",");
    const appDomain = domains.find(d => d.includes(".replit.app"));
    if (appDomain) return `https://${appDomain}`;
  }
  
  // Fallback: use request headers (for Render and other production environments)
  const protocol = req.headers["x-forwarded-proto"] || (process.env.NODE_ENV === "production" ? "https" : "http");
  const host = req.headers.host || req.hostname || `localhost:${process.env.PORT || 5000}`;
  return `${protocol}://${host}`;
}

async function createAsaasPaymentLink(params: {
  name: string;
  description: string;
  value: number;
  externalReference: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string; id: string } | null> {
  const apiBase = process.env.ASAAS_SANDBOX === "true"
    ? "https://sandbox.asaas.com/api/v3"
    : "https://www.asaas.com/api/v3";
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) {
    console.error("ASAAS_API_KEY not configured");
    return null;
  }

  try {
    const response = await fetch(`${apiBase}/paymentLinks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": apiKey
      },
      body: JSON.stringify({
        name: params.name,
        description: params.description,
        value: params.value,
        billingType: "UNDEFINED",
        chargeType: "DETACHED",
        dueDateLimitDays: 7,
        externalReference: params.externalReference,
        notificationEnabled: true,
        subscriptionCycle: null,
        callback: {
          successUrl: params.successUrl,
          cancelUrl: params.cancelUrl,
          autoRedirect: true
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Asaas payment link error:", errorText);
      return null;
    }

    const data = await response.json();
    return { url: data.url, id: data.id };
  } catch (error) {
    console.error("Asaas API error:", error);
    return null;
  }
}

export function registerBillingRoutes(app: Express) {
  app.get("/api/billing/plans", async (req, res) => {
    try {
      await storage.seedBillingPlans();
      const plans = await storage.getBillingPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ message: "Erro ao buscar planos" });
    }
  });

  app.post("/api/billing/checkout", authenticate, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ message: "Não autenticado" });

      const { planCode, planSlug, couponCode, paymentMethod } = req.body;

      const resolvedPlanCode = planCode || mapPlanSlugToCode(planSlug);
      if (!resolvedPlanCode) {
        return res.status(400).json({ message: "Plano não informado" });
      }

      await storage.seedBillingPlans();
      const plan = await storage.getBillingPlan(resolvedPlanCode);
      if (!plan) {
        return res.status(400).json({ message: "Plano não encontrado" });
      }

      let discountCents = 0;
      let validatedCoupon: string | null = null;

      if (couponCode) {
        const coupon = await storage.getPromoCouponByCode(couponCode);
        if (coupon && coupon.isActive) {
          const now = new Date();
          const isValid = (!coupon.validFrom || new Date(coupon.validFrom) <= now) &&
                         (!coupon.validUntil || new Date(coupon.validUntil) >= now) &&
                         (!coupon.maxUses || (coupon.currentUses || 0) < coupon.maxUses);
          
          if (isValid) {
            const discountVal = parseFloat(coupon.discountValue as string) || 0;
            if (coupon.discountType === "percentage") {
              discountCents = Math.floor(plan.priceCents * (discountVal / 100));
            } else {
              discountCents = Math.floor(discountVal * 100);
            }
            validatedCoupon = couponCode;
          }
        }
      }

      const finalPriceCents = Math.max(plan.priceCents - discountCents, 0);
      const finalPriceReais = finalPriceCents / 100;

      const order = await storage.createBillingOrder({
        userId,
        planCode: resolvedPlanCode,
        originalPriceCents: plan.priceCents,
        discountCents,
        finalPriceCents,
        couponCode: validatedCoupon,
        paymentMethod: paymentMethod || null,
        status: "pending"
      });

      const baseUrl = getPublishedDomain(req);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Usuário não encontrado" });
      }

      const paymentLink = await createAsaasPaymentLink({
        name: `Salva Plantão - ${plan.name}`,
        description: `Assinatura ${plan.name} - ${plan.durationDays} dias`,
        value: finalPriceReais,
        externalReference: `${userId}|${order.id}`,
        successUrl: `${baseUrl}/billing/success?order=${order.id}`,
        cancelUrl: `${baseUrl}/billing/cancel?order=${order.id}`
      });

      if (!paymentLink) {
        await storage.updateBillingOrder(order.id, { status: "failed" });
        return res.status(500).json({ message: "Erro ao criar link de pagamento" });
      }

      await storage.updateBillingOrder(order.id, { 
        asaasPaymentId: paymentLink.id,
        asaasPaymentUrl: paymentLink.url,
        status: "processing"
      });

      res.json({ url: paymentLink.url, orderId: order.id });
    } catch (error) {
      console.error("Checkout error:", error);
      res.status(500).json({ message: "Erro ao processar checkout" });
    }
  });

  app.get("/api/billing/status", authenticate, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ message: "Não autenticado" });

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      if (user.role === "admin") {
        return res.json({
          status: "active",
          isAdmin: true,
          accessUntil: null,
          planCode: null
        });
      }

      const entitlement = await storage.getUserEntitlement(userId);
      
      if (!entitlement) {
        return res.json({
          status: "inactive",
          accessUntil: null,
          planCode: null
        });
      }

      const now = new Date();
      const isActive = entitlement.status === "active" && 
                       entitlement.accessUntil && 
                       new Date(entitlement.accessUntil) > now;

      res.json({
        status: isActive ? "active" : "expired",
        accessUntil: entitlement.accessUntil,
        planCode: entitlement.planCode
      });
    } catch (error) {
      console.error("Billing status error:", error);
      res.status(500).json({ message: "Erro ao verificar status" });
    }
  });

  app.get("/api/billing/orders", authenticate, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ message: "Não autenticado" });

      const orders = await storage.getUserBillingOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error("Orders fetch error:", error);
      res.status(500).json({ message: "Erro ao buscar pedidos" });
    }
  });

  app.post("/api/webhooks/asaas", async (req, res) => {
    // WEBHOOK HANDLER - ALWAYS RETURN 200 TO ASAAS
    // Idempotency is guaranteed by eventKey unique constraint + status check
    
    try {
      // 1. VALIDATE WEBHOOK TOKEN (Security)
      const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
      const headerToken = req.headers["x-asaas-webhook-token"] as string | undefined;
      
      if (webhookToken && webhookToken !== headerToken) {
        console.warn("[WEBHOOK] Invalid token received");
        return res.status(401).json({ message: "Webhook token inválido" });
      }

      // 2. EXTRACT & VALIDATE PAYLOAD (Minimal)
      const { event, payment } = req.body;
      
      if (!event || !payment?.id) {
        console.warn("[WEBHOOK] Missing event or payment.id", { event, paymentId: payment?.id });
        return res.status(400).json({ message: "Evento ou ID de pagamento não encontrado" });
      }

      // 3. BUILD STABLE EVENT KEY FOR IDEMPOTENCY
      // eventKey = provider:event:paymentId (ensures uniqueness)
      const eventKey = `asaas:${event}:${payment.id}`;
      
      console.log(`[WEBHOOK] Processing event: ${eventKey}`);

      // 4. CHECK IF ALREADY PROCESSED (Idempotency Check)
      const existingEvent = await storage.getWebhookEventByKey(eventKey);
      
      if (existingEvent) {
        // Event already recorded in DB
          if (existingEvent.processingStatus === "processed") {
          // ✅ Already successfully processed - return 200 (Idempotent!)
          console.log(`[WEBHOOK] Event already processed: ${eventKey}`);
          return res.json({ received: true, duplicate: true, processedAt: existingEvent.processedAt });
          } else if (existingEvent.processingStatus === "failed") {
          // ⚠️ Previous attempt failed - log but return 200 to avoid retry loop
          console.log(`[WEBHOOK] Event previously failed: ${eventKey}, retrying...`);
          // Fall through to retry processing
        }
      }

      // 5. RECORD WEBHOOK RECEIPT (if new)
      let webhookRecord = existingEvent;
      if (!webhookRecord) {
        webhookRecord = await storage.createWebhookEvent({
          provider: "asaas",
          eventType: event,
          eventKey,
          payload: req.body,
            processingStatus: "pending"
        });
        console.log(`[WEBHOOK] Event recorded: id=${webhookRecord.id}, eventKey=${eventKey}`);
      }

      // 6. PROCESS EVENT (idempotent logic)
      try {
        await processAsaasPaymentEvent(event, payment);
        
        // 7. MARK AS PROCESSED
        await storage.markWebhookEventProcessed(webhookRecord.id, "processed");
        console.log(`[WEBHOOK] Event processed successfully: ${eventKey}`);
        
        return res.json({ received: true, status: "processed" });
      } catch (processError) {
        // 8. MARK AS ERROR (but still return 200)
        const errorMessage = processError instanceof Error ? processError.message : "Unknown error";
        await storage.markWebhookEventProcessed(webhookRecord.id, "failed", errorMessage);
        console.error(`[WEBHOOK] Error processing event ${eventKey}:`, processError);
        
        // ✅ IMPORTANT: Return 200 to Asaas even if processing failed
        // Asaas shouldn't retry on our processing errors - that's our responsibility
        return res.json({ received: true, status: "error", message: errorMessage });
      }
    } catch (error) {
      // Catastrophic error (DB issue, etc) - still return 200
      console.error("[WEBHOOK] Catastrophic error:", error);
      return res.status(200).json({ received: true, error: true, message: "Internal processing error" });
    }
  });

  app.post("/api/billing/validate-coupon", async (req, res) => {
    try {
      const { couponCode, planCode } = req.body;

      const normalizedCoupon = typeof couponCode === "string" ? couponCode.trim().toUpperCase() : "";
      if (!normalizedCoupon) {
        return res.status(400).json({ valid: false, message: "Código não informado" });
      }

      const coupon = await storage.getPromoCouponByCode(normalizedCoupon);
      if (!coupon || !coupon.isActive) {
        return res.json({ valid: false, message: "Cupom inválido" });
      }

      const now = new Date();
      if (coupon.validFrom && new Date(coupon.validFrom) > now) {
        return res.json({ valid: false, message: "Cupom ainda não está ativo" });
      }
      if (coupon.validUntil && new Date(coupon.validUntil) < now) {
        return res.json({ valid: false, message: "Cupom expirado" });
      }
      if (coupon.maxUses && (coupon.currentUses || 0) >= coupon.maxUses) {
        return res.json({ valid: false, message: "Cupom esgotado" });
      }

      let discountCents = 0;
      const discountVal = parseFloat(coupon.discountValue as string) || 0;
      if (planCode) {
        const plan = await storage.getBillingPlan(planCode);
        if (plan) {
          if (coupon.discountType === "percentage") {
            discountCents = Math.floor(plan.priceCents * (discountVal / 100));
          } else {
            discountCents = Math.floor(discountVal * 100);
          }
        }
      }

      res.json({
        valid: true,
        discountType: coupon.discountType,
        discountValue: discountVal,
        discountCents
      });
    } catch (error) {
      console.error("Coupon validation error:", error);
      res.status(500).json({ valid: false, message: "Erro ao validar cupom" });
    }
  });
}

/**
 * Process Asaas payment event with idempotent logic
 * This function is called after webhook idempotency check
 * All database updates should be safe to run multiple times
 */
async function processAsaasPaymentEvent(event: string, payment: any): Promise<void> {
  const externalReference = payment?.externalReference;

  // Handle relevant payment events
  const paymentEvents = ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED", "PAYMENT_UPDATED", "PAYMENT_OVERDUE", "PAYMENT_DELETED", "PAYMENT_REFUNDED"];
  if (!paymentEvents.includes(event)) {
    console.log(`[PAYMENT] Event ${event} does not require processing`);
    return;
  }

  // Determine new payment status based on event type
  let newStatus: string;
  switch (event) {
    case "PAYMENT_CONFIRMED":
    case "PAYMENT_RECEIVED":
      newStatus = "PAID";
      break;
    case "PAYMENT_OVERDUE":
      newStatus = "FAILED";
      break;
    case "PAYMENT_DELETED":
    case "PAYMENT_REFUNDED":
      newStatus = "REFUNDED";
      break;
    case "PAYMENT_UPDATED":
      newStatus = (payment.status?.toUpperCase?.() || "pending");
      break;
    default:
      newStatus = "pending";
  }

  console.log(`[PAYMENT] Processing event: ${event} → status: ${newStatus}`);

  // BILLING ORDER UPDATE
  if (externalReference?.includes("|")) {
    const [userId, orderIdStr] = externalReference.split("|");
    const orderId = parseInt(orderIdStr);

    if (userId && !isNaN(orderId)) {
      const order = await storage.getBillingOrder(orderId);
      if (order) {
        // Only mark as paid if not already in final state
        if (newStatus === "PAID" && order.status !== "PAID") {
          console.log(`[BILLING] Marking order ${orderId} as PAID`);
          await storage.updateBillingOrder(orderId, {
            status: "PAID",
            paidAt: new Date()
          });

          // Activate user entitlement
          const plan = await storage.getBillingPlan(order.planCode);
          if (plan) {
            console.log(`[ENTITLEMENT] Activating ${order.planCode} for user ${userId}`);
            await storage.activateUserEntitlement(userId, order.planCode, plan.durationDays, orderId);
            await storage.updateUserStatus(userId, "active");
          }

          // Increment coupon usage if applicable
          if (order.couponCode) {
            const coupon = await storage.getPromoCouponByCode(order.couponCode);
            if (coupon) {
              console.log(`[COUPON] Incrementing usage for ${order.couponCode}`);
              await storage.updatePromoCoupon(coupon.id, {
                currentUses: (coupon.currentUses || 0) + 1
              } as any);
            }
          }
        }
      } else {
        console.warn(`[BILLING] Order not found: ${orderId}`);
      }
    }
  }

  // PAYMENT TRACKING (if available)
  if (payment?.id) {
    const existingPayment = await storage.getPaymentByProviderId(payment.id);
    if (existingPayment) {
      console.log(`[PAYMENT] Updating payment ${payment.id} status to ${newStatus}`);
      await storage.updatePayment(existingPayment.id, {
        status: newStatus,
        paidAt: newStatus === "PAID" ? new Date() : null
      });

      // Update associated subscription if paid
      if (newStatus === "PAID" && existingPayment.subscriptionId) {
        const subscription = await storage.getSubscription(existingPayment.subscriptionId);
        if (subscription) {
          console.log(`[SUBSCRIPTION] Activating subscription ${existingPayment.subscriptionId}`);
          await storage.updateSubscription(subscription.id, {
            status: "active",
            lastPaymentStatus: "PAID"
          });
          await storage.updateUserStatus(subscription.userId, "active");
        }
      }
    }
  }

  console.log(`[PAYMENT] Event processed successfully: ${event}`);
}

function mapPlanSlugToCode(planSlug?: string): string | null {
  if (!planSlug) return null;
  const normalized = planSlug.toLowerCase();
  if (normalized === "mensal" || normalized === "monthly") return "monthly";
  if (normalized === "semestral" || normalized === "semiannual" || normalized === "semiannually") return "semiannual";
  if (normalized === "anual" || normalized === "annual" || normalized === "yearly") return "annual";
  return null;
}
