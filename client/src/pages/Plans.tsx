import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2, CreditCard, QrCode, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { SiGoogle } from "react-icons/si";

type PaymentMethod = "pix" | "credit_card";

export default function Plans() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [fullName, setFullName] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [phone, setPhone] = useState("");

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google/start";
  };

  const handleSubscribe = async (method: PaymentMethod) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para assinar",
        variant: "destructive"
      });
      navigate("/login");
      return;
    }

    if (!cpfCnpj || cpfCnpj.replace(/\D/g, "").length < 11) {
      toast({
        title: "CPF inválido",
        description: "Informe um CPF válido para continuar",
        variant: "destructive"
      });
      return;
    }

    if (!phone || phone.replace(/\D/g, "").length < 10) {
      toast({
        title: "Telefone inválido",
        description: "Informe um telefone válido com DDD",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setSelectedMethod(method);

    try {
      const response = await apiRequest("POST", "/api/subscription/create", {
        planSlug: "mensal",
        paymentMethod: method === "pix" ? "PIX" : "CREDIT_CARD",
        name: fullName || user?.firstName || "",
        cpfCnpj,
        phone
      });

      const invoiceUrl = response?.invoiceUrl || response?.payment?.invoiceUrl;

      if (method === "pix") {
        const pixData = {
          pixQrCode: response?.pixQrCode,
          pixCopyPaste: response?.pixCopyPaste,
          amountCents: response?.payment?.amountCents
        };

        localStorage.setItem("billingPixData", JSON.stringify(pixData));

        toast({
          title: "✓ Assinatura criada!",
          description: "Escaneie o QR Code para completar o pagamento"
        });

        navigate(`/billing/pix?subscriptionId=${response?.subscription?.id || ""}`);
        return;
      }

      if (invoiceUrl) {
        toast({
          title: "✓ Assinatura criada!",
          description: "Complete o pagamento no Asaas"
        });

        window.location.href = invoiceUrl;
        return;
      }

      toast({
        title: "Erro",
        description: response?.message || "Falha ao gerar pagamento",
        variant: "destructive"
      });
    } catch (error: any) {
      console.error("Erro ao criar assinatura:", error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao processar assinatura",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setSelectedMethod(null);
    }
  };

  const features = [
    "Prescrições inteligentes com IA",
    "Protocolos médicos atualizados",
    "Calculadoras médicas avançadas",
    "Biblioteca completa de medicamentos",
    "Interconsulta com IA médica",
    "Sincronização em tempo real",
    "Suporte prioritário 24/7",
    "Sem limite de uso"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Header */}
      <header className="px-4 py-6 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button
            onClick={() => navigate("/")}
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
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Escolha seu plano
          </h1>
          <p className="text-xl text-gray-600">
            Acesso completo a todas as funcionalidades
          </p>
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold">
            🎉 7 dias grátis para testar
          </div>
        </div>

        {/* Plan Card */}
        <Card className="bg-gradient-to-br from-white to-emerald-50/30 p-8 md:p-12 shadow-2xl border-2 border-emerald-200">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Plano Mensal</h2>
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-6xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                R$ 29
              </span>
              <span className="text-3xl text-gray-600">,90</span>
              <span className="text-xl text-gray-600">/mês</span>
            </div>
            <p className="text-emerald-600 font-semibold">
              Primeiro pagamento após 7 dias de teste
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 gap-4 mb-10">
            {features.map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>

          {/* Payment Methods */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-4">
              Escolha a forma de pagamento:
            </h3>

            {!user && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <p className="text-sm text-emerald-800 mb-3">
                  Para assinar, faça login com Google ou Email
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={handleGoogleLogin}
                    variant="outline"
                    className="border-2"
                  >
                    <SiGoogle className="w-4 h-4 mr-2" />
                    Entrar com Google
                  </Button>
                  <Button
                    onClick={() => navigate("/login")}
                    className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white"
                  >
                    Entrar com Email
                  </Button>
                </div>
              </div>
            )}

            <div className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome completo</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpfCnpj">CPF</Label>
                  <Input
                    id="cpfCnpj"
                    value={cpfCnpj}
                    onChange={(e) => setCpfCnpj(e.target.value)}
                    placeholder="000.000.000-00"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone com DDD</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              onClick={() => handleSubscribe("pix")}
              disabled={isLoading || !user}
              size="lg"
              variant="outline"
              className="w-full h-16 text-lg border-2 hover:bg-emerald-50 hover:border-emerald-500 transition-all"
            >
              {isLoading && selectedMethod === "pix" ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Gerando PIX...
                </>
              ) : (
                <>
                  <QrCode className="w-6 h-6 mr-3 text-emerald-600" />
                  <div className="text-left">
                    <div className="font-bold text-gray-900">Pagar com PIX</div>
                    <div className="text-sm text-gray-600">Aprovação instantânea</div>
                  </div>
                </>
              )}
            </Button>

            <Button
              onClick={() => handleSubscribe("credit_card")}
              disabled={isLoading || !user}
              size="lg"
              className="w-full h-16 text-lg bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white transition-all shadow-lg hover:shadow-xl"
            >
              {isLoading && selectedMethod === "credit_card" ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CreditCard className="w-6 h-6 mr-3" />
                  <div className="text-left">
                    <div className="font-bold">Pagar com Cartão</div>
                    <div className="text-sm opacity-90">Renovação automática</div>
                  </div>
                </>
              )}
            </Button>
          </div>

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-2">
              🔒 Pagamento 100% seguro via Asaas
            </p>
            <p className="text-xs text-gray-500">
              Cancele a qualquer momento, sem multas ou taxas
            </p>
          </div>
        </Card>

        {/* Trust Badges */}
        <div className="mt-12 grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-emerald-600 mb-1">+1.000</div>
            <div className="text-sm text-gray-600">Médicos ativos</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-emerald-600 mb-1">4.9★</div>
            <div className="text-sm text-gray-600">Avaliação média</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-emerald-600 mb-1">24/7</div>
            <div className="text-sm text-gray-600">Suporte disponível</div>
          </div>
        </div>
      </div>
    </div>
  );
}
