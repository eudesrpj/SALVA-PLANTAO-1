import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, QrCode } from "lucide-react";

export default function PaymentRequired() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="text-center">
          <div className="mx-auto bg-blue-100 p-3 rounded-full w-fit mb-4">
            <QrCode className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-display text-slate-900">Assinatura Necessária</CardTitle>
          <CardDescription>
            Olá, {user?.firstName}! Para acessar o Salva Plantão, realize o pagamento via Pix.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-slate-100 p-4 rounded-lg text-center space-y-2">
            <p className="text-sm font-medium text-slate-500">Chave Pix (CNPJ/Email/Tel):</p>
            <p className="text-lg font-bold font-mono text-slate-900 select-all cursor-pointer" 
               onClick={() => navigator.clipboard.writeText("00.000.000/0001-00")}>
              00.000.000/0001-00
            </p>
            <p className="text-xs text-slate-400">(Clique para copiar)</p>
          </div>
          
          <div className="text-sm text-slate-600 space-y-2">
            <p><strong>Valor:</strong> R$ 29,90 / mês</p>
            <p>Após o pagamento, envie o comprovante para o administrador para liberação imediata.</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t bg-slate-50/50 p-6 rounded-b-xl">
          <Button variant="ghost" onClick={() => logout()} className="text-red-500 hover:text-red-600 hover:bg-red-50">
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
          <Button onClick={() => window.open("https://wa.me/5500000000000", "_blank")}>
            Enviar Comprovante
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
