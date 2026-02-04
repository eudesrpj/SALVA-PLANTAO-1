import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuthGuard, useSubscriptionStatus } from "@/hooks/use-auth-guard";
import { 
  Check, Loader2, CreditCard, QrCode, ArrowLeft, Sparkles, 
  Shield, Users, Clock, Zap, HeartHandshake, Crown, Star,
  CheckCircle2, X, Phone, User, FileText
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { CouponValidator } from "@/components/CouponValidator";
import { cn } from "@/lib/utils";

type PaymentMethod = "pix" | "credit_card";
type SubscriptionStep = "plan" | "payment" | "checkout";

interface PlanFeature {
  text: string;
  highlight?: boolean;
  premium?: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  period: string;
  popular?: boolean;
  features: PlanFeature[];
  badge?: string;
  savings?: string;
}

export default function Subscribe() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const { canAccess, isLoading: guardLoading, user } = useAuthGuard({ 
    level: "authenticated",
    redirectOnFail: true 
  });
  
  const { hasActiveSubscription } = useSubscriptionStatus();

  // States
  const [currentStep, setCurrentStep] = useState<SubscriptionStep>("plan");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form data
  const [customerData, setCustomerData] = useState({
    fullName: "",
    cpfCnpj: "",
    phone: "",
    couponCode: ""
  });

  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    description: string;
  } | null>(null);

  // Redirect if already subscribed
  useEffect(() => {
    if (hasActiveSubscription && !guardLoading) {
      toast({
        title: "Assinatura ativa",
        description: "Você já possui uma assinatura ativa!",
      });
      navigate("/dashboard");
    }
  }, [hasActiveSubscription, guardLoading, navigate, toast]);

  // Loading state while checking auth
  if (guardLoading || !canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-blue-50">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"/>
      </div>
    );
  }

  const plans: Plan[] = [
    {
      id: "monthly",
      name: "Mensal",
      price: 39.90,
      period: "/mês",
      features: [
        { text: "Prescrições inteligentes com IA", highlight: true },
        { text: "Protocolos médicos atualizados" },
        { text: "Calculadoras médicas avançadas" },
        { text: "Biblioteca completa de medicamentos" },
        { text: "Interconsulta com IA médica", premium: true },
        { text: "Sincronização em tempo real" },
        { text: "Suporte prioritário", premium: true },
        { text: "Acesso ilimitado" }
      ]
    },
    {
      id: "annual",
      name: "Anual",
      price: 29.90,
      originalPrice: 39.90,
      period: "/mês",
      popular: true,
      badge: "Mais Popular",
      savings: "Economize 25%",
      features: [
        { text: "Todos os benefícios do plano mensal" },
        { text: "Desconto especial de 25%", highlight: true },
        { text: "12 meses pelo preço de 9", highlight: true },
        { text: "Acesso prioritário a novos recursos", premium: true },
        { text: "Treinamentos exclusivos", premium: true },
        { text: "Suporte VIP 24/7", premium: true },
        { text: "Backup premium dos dados", premium: true },
        { text: "Garantia de satisfação" }
      ]
    }
  ];

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setCurrentStep("payment");
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setCurrentStep("checkout");
  };

  const handleBackStep = () => {
    if (currentStep === "checkout") {
      setCurrentStep("payment");
      setSelectedMethod(null);
    } else if (currentStep === "payment") {
      setCurrentStep("plan");
      setSelectedPlan(null);
    } else {
      navigate("/dashboard");
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPlan || !selectedMethod) return;

    // Validation
    if (!customerData.cpfCnpj || customerData.cpfCnpj.replace(/\\D/g, "").length < 11) {
      toast({
        title: "CPF inválido",
        description: "Informe um CPF válido para continuar",
        variant: "destructive"
      });
      return;
    }

    if (!customerData.phone || customerData.phone.replace(/\\D/g, "").length < 10) {
      toast({
        title: "Telefone inválido", 
        description: "Informe um telefone válido com DDD",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/subscription/create", {
        plan: selectedPlan,
        paymentMethod: selectedMethod,
        customer: {
          name: customerData.fullName || user?.firstName + " " + user?.lastName,
          cpfCnpj: customerData.cpfCnpj,
          phone: customerData.phone,
          email: user?.email
        },
        couponCode: customerData.couponCode || undefined
      });

      if (response?.success && response.paymentUrl) {
        toast({
          title: "Assinatura criada!",
          description: "Redirecionando para pagamento...",
        });

        // Redirect to payment
        window.location.href = response.paymentUrl;
      } else {
        toast({
          title: "Erro",
          description: response?.message || "Falha ao criar assinatura",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Erro ao criar assinatura:", error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao processar assinatura",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);
  
  // Calculate prices with coupon
  const calculatePrices = () => {
    if (!selectedPlanData) return { subtotal: 0, discount: 0, total: 0 };
    
    const subtotal = selectedPlanData.price;
    let discount = 0;
    
    // Apply coupon discount
    if (appliedCoupon) {
      discount += subtotal * (appliedCoupon.discount / 100);
    }
    
    // Apply plan discount (if any)
    if (selectedPlanData.originalPrice) {
      discount += selectedPlanData.originalPrice - selectedPlanData.price;
    }
    
    const total = Math.max(0, subtotal - discount);
    
    return { subtotal, discount, total };
  };
  
  const prices = calculatePrices();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 px-4 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleBackStep}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
                <span className="text-sm font-bold text-white">SP</span>
              </div>
              <span className="text-lg font-bold text-gray-900">Salva Plantão</span>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
            <div className={cn("flex items-center gap-1", currentStep === "plan" && "text-emerald-600 font-medium")}>
              <div className={cn("w-2 h-2 rounded-full", currentStep === "plan" ? "bg-emerald-600" : "bg-gray-300")} />
              Plano
            </div>
            <div className="w-8 h-px bg-gray-300" />
            <div className={cn("flex items-center gap-1", currentStep === "payment" && "text-emerald-600 font-medium")}>
              <div className={cn("w-2 h-2 rounded-full", currentStep === "payment" ? "bg-emerald-600" : "bg-gray-300")} />
              Pagamento
            </div>
            <div className="w-8 h-px bg-gray-300" />
            <div className={cn("flex items-center gap-1", currentStep === "checkout" && "text-emerald-600 font-medium")}>
              <div className={cn("w-2 h-2 rounded-full", currentStep === "checkout" ? "bg-emerald-600" : "bg-gray-300")} />
              Finalizar
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Step 1: Plan Selection */}
        {currentStep === "plan" && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
                  <Crown className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Escolha seu plano
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Desbloqueie todo o potencial do Salva Plantão com recursos premium
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {plans.map((plan) => (
                <Card 
                  key={plan.id}
                  className={cn(
                    "relative border-2 transition-all duration-200 hover:shadow-lg cursor-pointer",
                    plan.popular ? "border-emerald-500 shadow-emerald-100 bg-gradient-to-br from-emerald-50 to-white" : "border-gray-200 hover:border-emerald-300"
                  )}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1">
                        <Star className="w-3 h-3 mr-1" />
                        {plan.badge}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        {plan.originalPrice && (
                          <span className="text-lg text-gray-400 line-through">
                            R$ {plan.originalPrice.toFixed(2)}
                          </span>
                        )}
                        <span className="text-3xl font-bold text-gray-900">
                          R$ {plan.price.toFixed(2)}
                        </span>
                        <span className="text-gray-600">{plan.period}</span>
                      </div>
                      {plan.savings && (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                          {plan.savings}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <div 
                          key={index}
                          className={cn(
                            "flex items-start gap-3 text-sm",
                            feature.highlight && "bg-emerald-50 -mx-2 px-2 py-1 rounded-lg"
                          )}
                        >
                          <CheckCircle2 
                            className={cn(
                              "w-4 h-4 mt-0.5 flex-shrink-0",
                              feature.premium ? "text-amber-500" : "text-emerald-500"
                            )} 
                          />
                          <span className={cn(
                            feature.highlight && "font-medium text-emerald-800",
                            feature.premium && "text-amber-700"
                          )}>
                            {feature.text}
                            {feature.premium && <Crown className="w-3 h-3 inline ml-1" />}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Button 
                      className={cn(
                        "w-full mt-6 h-12 text-base font-semibold",
                        plan.popular 
                          ? "bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
                          : "bg-gray-900 hover:bg-gray-800"
                      )}
                    >
                      Escolher {plan.name}
                      <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Payment Method */}
        {currentStep === "payment" && selectedPlanData && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Como você quer pagar?
              </h1>
              <p className="text-gray-600">
                Plano selecionado: <strong>{selectedPlanData.name}</strong> - R$ {selectedPlanData.price.toFixed(2)}{selectedPlanData.period}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <Card 
                className={cn(
                  "border-2 transition-all duration-200 hover:shadow-lg cursor-pointer",
                  selectedMethod === "pix" ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-emerald-300"
                )}
                onClick={() => handleMethodSelect("pix")}
              >
                <CardContent className="p-6 text-center">
                  <QrCode className="w-12 h-12 mx-auto mb-4 text-emerald-600" />
                  <h3 className="text-lg font-semibold mb-2">PIX</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Aprovação instantânea<br />
                    Pagamento seguro via QR Code
                  </p>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                    Recomendado
                  </Badge>
                </CardContent>
              </Card>

              <Card 
                className={cn(
                  "border-2 transition-all duration-200 hover:shadow-lg cursor-pointer",
                  selectedMethod === "credit_card" ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-emerald-300"
                )}
                onClick={() => handleMethodSelect("credit_card")}
              >
                <CardContent className="p-6 text-center">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-lg font-semibold mb-2">Cartão de Crédito</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Pagamento parcelado<br />
                    Principais bandeiras aceitas
                  </p>
                  <Badge variant="outline">
                    Visa, Mastercard, Elo
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step 3: Checkout */}
        {currentStep === "checkout" && selectedPlanData && selectedMethod && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Finalize sua assinatura
              </h1>
              <p className="text-gray-600">
                Plano {selectedPlanData.name} via {selectedMethod === "pix" ? "PIX" : "Cartão de Crédito"}
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Seus dados
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Nome completo
                        </Label>
                        <Input
                          id="fullName"
                          value={customerData.fullName}
                          onChange={(e) => setCustomerData({...customerData, fullName: e.target.value})}
                          placeholder={user?.firstName + " " + (user?.lastName || "")}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cpfCnpj">CPF *</Label>
                        <Input
                          id="cpfCnpj"
                          value={customerData.cpfCnpj}
                          onChange={(e) => setCustomerData({...customerData, cpfCnpj: e.target.value})}
                          placeholder="000.000.000-00"
                          disabled={isLoading}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Telefone com DDD *
                      </Label>
                      <Input
                        id="phone"
                        value={customerData.phone}
                        onChange={(e) => setCustomerData({...customerData, phone: e.target.value})}
                        placeholder="(11) 99999-9999"
                        disabled={isLoading}
                        required
                      />
                    </div>

                    <div className="space-y-4">
                      <CouponValidator
                        onCouponApplied={(coupon) => {
                          setAppliedCoupon(coupon);
                          setCustomerData({...customerData, couponCode: coupon.code});
                        }}
                        onCouponRemoved={() => {
                          setAppliedCoupon(null);
                          setCustomerData({...customerData, couponCode: ""});
                        }}
                        disabled={isLoading}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Summary */}
              <div>
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      Resumo do pedido
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Plano {selectedPlanData.name}</span>
                        <span className="font-medium">R$ {prices.subtotal.toFixed(2)}</span>
                      </div>
                      {prices.discount > 0 && (
                        <div className="flex justify-between text-sm text-emerald-600">
                          <span>Desconto total</span>
                          <span>-R$ {prices.discount.toFixed(2)}</span>
                        </div>
                      )}
                      {appliedCoupon && (
                        <div className="flex justify-between text-sm text-blue-600">
                          <span>Cupom: {appliedCoupon.code}</span>
                          <span>-{appliedCoupon.discount}%</span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>R$ {prices.total.toFixed(2)}</span>
                    </div>

                    <div className="text-xs text-gray-500">
                      <p>• Renovação automática</p>
                      <p>• Cancele quando quiser</p>
                      <p>• Suporte 24/7</p>
                    </div>

                    <Button 
                      onClick={handleSubscribe}
                      disabled={isLoading}
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          {selectedMethod === "pix" ? (
                            <QrCode className="w-4 h-4 mr-2" />
                          ) : (
                            <CreditCard className="w-4 h-4 mr-2" />
                          )}
                          Finalizar assinatura
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-gray-500">
                      Ao continuar, você concorda com nossos termos de uso e política de privacidade.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}