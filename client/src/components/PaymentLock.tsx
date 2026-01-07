import { Lock, Smartphone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PaymentLock() {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in-up">
        <div className="bg-gradient-to-br from-primary to-blue-600 p-8 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="mx-auto bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-md mb-4 shadow-inner">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold font-display mb-2">Acesso Premium Bloqueado</h2>
          <p className="text-blue-100">Liberdade total para seus plantões.</p>
        </div>
        
        <div className="p-8">
          <div className="space-y-4 mb-8">
            <FeatureRow text="Acesso ilimitado a Prescrições & Condutas" />
            <FeatureRow text="Calculadoras Médicas Avançadas" />
            <FeatureRow text="Interconsulta com Inteligência Artificial" />
            <FeatureRow text="Gestão Financeira de Plantões" />
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm text-slate-500 mb-2 font-medium">Pagamento via Pix</p>
            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-slate-900 font-mono">
              <Smartphone className="w-6 h-6 text-primary" />
              <span>R$ 29,90<span className="text-sm text-slate-400 font-normal">/mês</span></span>
            </div>
          </div>

          <div className="space-y-3">
             <Button className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/20 rounded-xl" onClick={() => window.open("https://wa.me/5500000000000?text=Quero%20liberar%20meu%20acesso%20ao%20Salva%20Plantão", "_blank")}>
               Liberar Acesso Agora
             </Button>
             <p className="text-xs text-center text-slate-400">
               Envie o comprovante para o administrador liberar seu acesso.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
      <span className="text-slate-600 text-sm font-medium">{text}</span>
    </div>
  );
}
