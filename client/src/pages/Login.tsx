import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2, ArrowLeft, KeyRound } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

type AuthStep = "email" | "code" | "password";

export default function Login() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/email/request", { email });
      setStep("code");
      toast({
        title: "Enviado!",
        description: "Verifique seu email para o codigo de acesso"
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Falha ao enviar email",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) return;

    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/email/verify-code", { email, code });
      
      toast({
        title: "Sucesso!",
        description: "Login realizado com sucesso"
      });
      
      // Aguardar um pouco para garantir que o cookie foi definido
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Invalidar cache e refetch antes de navegar
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      await queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
      
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Codigo invalido",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "/login";
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/login-password", { email, password });
      
      toast({
        title: "Sucesso!",
        description: "Login realizado com sucesso"
      });
      
      // Aguardar um pouco para garantir que o cookie foi definido
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Invalidar cache e aguardar refetch antes de navegar
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      const fetchResult = await queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
      
      // Verificar se conseguiu carregar o usuário
      if (fetchResult.isSuccess || fetchResult.length > 0) {
        navigate("/");
      } else {
        toast({
          title: "Erro",
          description: "Falha ao carregador dados do usuário. Tente novamente.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Credenciais inválidas",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="login-page">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            Salva Plantao
          </CardTitle>
          <CardDescription>
            {step === "email" 
              ? "Entre com seu email para acessar" 
              : step === "code"
              ? "Digite o codigo enviado para seu email"
              : "Login administrativo (dev)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "email" ? (
            <>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    data-testid="input-email"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || !email}
                  data-testid="button-send-code"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  Enviar codigo de acesso
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    ou continue com
                  </span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleGoogleLogin}
                disabled={isLoading}
                data-testid="button-google-login"
              >
                <SiGoogle className="w-4 h-4 mr-2" />
                Entrar com Google
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("password")}
                className="w-full mt-4 text-xs text-muted-foreground"
                disabled={isLoading}
              >
                <KeyRound className="w-3 h-3 mr-1" />
                Entrar com senha (dev)
              </Button>
            </>
          ) : step === "password" ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("email")}
                className="mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pass-email">Email</Label>
                  <Input
                    id="pass-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || !email || !password}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Entrar
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("email")}
                className="mb-2"
                data-testid="button-back-email"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              
              <p className="text-sm text-muted-foreground mb-4">
                Email: <strong>{email}</strong>
              </p>

              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Codigo de 6 digitos</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    disabled={isLoading}
                    className="text-center text-2xl tracking-widest"
                    data-testid="input-code"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || code.length !== 6}
                  data-testid="button-verify-code"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Verificar codigo
                </Button>
              </form>

              <p className="text-xs text-center text-muted-foreground mt-4">
                Tambem enviamos um link magico para seu email. 
                Clique nele para entrar automaticamente.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
