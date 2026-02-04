import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, Loader2, QrCode, ArrowLeft } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

type PixData = {
  pixQrCode?: string;
  pixCopyPaste?: string;
  amountCents?: number;
};

export default function BillingPix() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [isPolling, setIsPolling] = useState(true);
  const [localPixData, setLocalPixData] = useState<PixData | null>(null);

  // Pegar subscriptionId da URL
  const params = new URLSearchParams(window.location.search);
  const subscriptionId = params.get("subscriptionId");

  // Buscar últimos pagamentos
  const { data: payments, isLoading } = useQuery({
    queryKey: ["/api/subscription/payments"],
    enabled: !!subscriptionId
  });

  // Pegar o pagamento mais recente (que acabou de ser criado)
  const latestPayment = Array.isArray(payments) ? payments[0] : null;
  const pixQrCode = latestPayment?.pixQrCode || localPixData?.pixQrCode;
  const pixCopyPaste = latestPayment?.pixCopyPaste || localPixData?.pixCopyPaste;
  const amountCents = latestPayment?.amountCents ?? localPixData?.amountCents;

  useEffect(() => {
    const cached = localStorage.getItem("billingPixData");
    if (cached) {
      try {
        setLocalPixData(JSON.parse(cached));
      } catch {
        setLocalPixData(null);
      }
    }
  }, []);

  // Poll para verificar se o pagamento foi confirmado
  useEffect(() => {
    if (!isPolling || !subscriptionId) return;

    const interval = setInterval(async () => {
      try {
        const status: any = await queryClient.fetchQuery({ 
          queryKey: ["/api/subscription/status"] 
        });

        if (status?.subscription?.lastPaymentStatus === "PAID") {
          setIsPolling(false);
          localStorage.removeItem("billingPixData");
          toast({
            title: "✓ Pagamento confirmado!",
            description: "Seu acesso foi liberado. Bem-vindo!",
          });
          
          setTimeout(() => {
            navigate("/");
          }, 2000);
        }
      } catch (error) {
        console.error("Erro ao verificar pagamento:", error);
      }
    }, 3000); // Verificar a cada 3 segundos

    return () => clearInterval(interval);
  }, [isPolling, subscriptionId, queryClient, toast, navigate]);

  const handleCopyPix = async () => {
    if (!pixCopyPaste) return;

    try {
      await navigator.clipboard.writeText(pixCopyPaste);
      setCopied(true);
      toast({
        title: "✓ Código PIX copiado!",
        description: "Cole no seu app do banco para pagar"
      });
      
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar. Tente selecionar manualmente.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-blue-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!latestPayment && !localPixData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-4">
        <Card className="p-8 text-center max-w-md">
          <p className="text-gray-600 mb-4">Nenhum pagamento encontrado</p>
          <Button onClick={() => navigate("/plans")} variant="outline">
            Voltar para planos
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Header */}
      <header className="px-4 py-6 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Button
            onClick={() => navigate("/plans")}
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
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
            <QrCode className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pague com PIX
          </h1>
          <p className="text-gray-600">
            Escaneie o QR Code ou copie o código para pagar
          </p>
        </div>

        <Card className="p-8 mb-6">
          {/* QR Code */}
          {pixQrCode && (
            <div className="flex justify-center mb-6">
              <img
                src={`data:image/png;base64,${pixQrCode}`}
                alt="QR Code PIX"
                className="w-64 h-64 border-4 border-emerald-200 rounded-lg"
              />
            </div>
          )}

          {/* Código PIX */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Código PIX Copia e Cola:
              </label>
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-xs break-all text-gray-700">
                  {latestPayment.pixCopyPaste}
                </div>
                <Button
                  onClick={handleCopyPix}
                  size="lg"
                  className="flex-shrink-0"
                  variant={copied ? "default" : "outline"}
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5 mr-2" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Valor */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Valor:</span>
                <span className="text-2xl font-bold text-gray-900">
                  R$ {((amountCents || 0) / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Status de pagamento */}
        {isPolling && (
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">Aguardando pagamento...</p>
                <p className="text-sm text-blue-700">
                  Você será redirecionado automaticamente após a confirmação
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Instruções */}
        <div className="mt-8 space-y-4">
          <h3 className="font-semibold text-gray-900">Como pagar:</h3>
          <ol className="space-y-3 text-gray-600">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm flex items-center justify-center">
                1
              </span>
              <span>Abra o app do seu banco</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm flex items-center justify-center">
                2
              </span>
              <span>Escolha pagar com PIX QR Code ou Copia e Cola</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm flex items-center justify-center">
                3
              </span>
              <span>Confirme o pagamento de R$ {((amountCents || 0) / 100).toFixed(2)}</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm flex items-center justify-center">
                4
              </span>
              <span>Aguarde a confirmação (geralmente instantânea)</span>
            </li>
          </ol>
        </div>

        {/* Ajuda */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Problemas com o pagamento?{" "}
            <a href="/chat" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              Entre em contato
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
