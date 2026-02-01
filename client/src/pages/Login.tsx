import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { apiRequest, tokenStorage } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

type AuthStep = "method" | "email" | "code" | "password";

export default function Login() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<AuthStep>("method");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Limpar erro quando o usuário começa a digitar
  useEffect(() => {
    setError("");
  }, [email, code, password]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Digite um email válido");
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/email/request", { email });
      setStep("code");
      toast({
        title: "✓ Email enviado!",
        description: "Verifique seu email para o código de acesso"
      });
    } catch (error: any) {
      const msg = error.message || "Falha ao enviar email";
      setError(msg);
      toast({
        title: "Erro",
        description: msg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError("Digite os 6 dígitos do código");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/email/verify-code", { email, code });
      if (response?.token) {
        tokenStorage.set(response.token);
      }
      
      toast({
        title: "✓ Login realizado!",
        description: "Bem-vindo ao Salva Plantão"
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      const result = await queryClient.fetchQuery({ queryKey: ["/api/auth/me"] });
      
      if (result) {
        navigate("/");
      }
    } catch (error: any) {
      const msg = error.message || "Código inválido ou expirado";
      setError(msg);
      toast({
        title: "Erro",
        description: msg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Digite um email válido");
      return;
    }
    if (!password || password.length < 3) {
      setError("Digite uma senha válida");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/login-password", { email, password });
      
      // GUARDAR TOKEN NO LOCALSTORAGE
      if (response.token) {
        console.log("✓ Token recebido, salvando no localStorage");
        tokenStorage.set(response.token);
      } else {
        console.error("✗ Token não retornado pelo servidor");
      }
      
      toast({
        title: "✓ Login realizado!",
        description: "Bem-vindo ao Salva Plantão"
      });
      
      // Aguardar um pouco para garantir que o token foi salvo
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Recarregar dados do usuário
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      const result = await queryClient.fetchQuery({ queryKey: ["/api/auth/me"] });
      
      if (result) {
        console.log("✓ Usuário autenticado, navegando para Dashboard");
        navigate("/");
      } else {
        console.error("✗ Falha ao carregar dados do usuário");
        setError("Falha ao carregar dados do usuário");
      }
    } catch (error: any) {
      const msg = error.message || "Credenciais inválidas";
      setError(msg);
      console.error("❌ Erro no login:", msg);
      toast({
        title: "Erro",
        description: msg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google/start";
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4" data-testid="login-page">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-emerald-200/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-blue-200/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white">SP</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Salva Plantão
          </h1>
          <p className="text-gray-600">Sua plataforma de saúde inteligente</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-8">
            {/* Método de login */}
            {step === "method" && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Escolha como deseja entrar
                </h2>

                <Button
                  onClick={handleGoogleLogin}
                  variant="outline"
                  size="lg"
                  className="w-full h-12 text-base border-2 hover:bg-gray-50 hover:border-gray-300 transition-all"
                  disabled={isLoading}
                >
                  <SiGoogle className="w-5 h-5 mr-3" />
                  Continuar com Google
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 bg-white text-sm font-medium text-gray-500">
                      ou
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setStep("email");
                    setEmail("");
                    setError("");
                  }}
                  size="lg"
                  className="w-full h-12 text-base bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white transition-all shadow-lg hover:shadow-xl"
                  disabled={isLoading}
                >
                  <Mail className="w-5 h-5 mr-3" />
                  Entrar com Email
                </Button>

                <Button
                  onClick={() => {
                    setStep("password");
                    setEmail("");
                    setPassword("");
                    setError("");
                  }}
                  variant="ghost"
                  size="lg"
                  className="w-full h-12 text-base text-gray-700 hover:bg-gray-100 transition-all"
                  disabled={isLoading}
                >
                  Entrar com Senha
                </Button>
              </div>
            )}

            {/* Email step */}
            {step === "email" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Verifique seu email
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Enviaremos um código de 6 dígitos para seu email
                  </p>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="h-12 text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      data-testid="input-email"
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-12 text-base bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                    disabled={isLoading || !email}
                    data-testid="button-send-code"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5 mr-2" />
                        Enviar código
                      </>
                    )}
                  </Button>
                </form>

                <Button
                  onClick={() => {
                    setStep("method");
                    setEmail("");
                    setError("");
                  }}
                  variant="ghost"
                  className="w-full text-gray-600 hover:text-gray-900"
                  disabled={isLoading}
                >
                  ← Voltar
                </Button>
              </div>
            )}

            {/* Code verification step */}
            {step === "code" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Digite o código
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Enviamos um código para <span className="font-semibold text-gray-900">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleCodeSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-gray-700 font-medium">
                      Código (6 dígitos)
                    </Label>
                    <Input
                      id="code"
                      type="text"
                      placeholder="000000"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                      disabled={isLoading}
                      className="h-14 text-center text-3xl tracking-widest font-bold border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      data-testid="input-code"
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-12 text-base bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                    disabled={isLoading || code.length !== 6}
                    data-testid="button-verify-code"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Verificando...
                      </>
                    ) : (
                      "Verificar código"
                    )}
                  </Button>
                </form>

                <p className="text-xs text-center text-gray-600">
                  Também enviamos um link mágico para seu email. Clique nele para entrar automaticamente.
                </p>

                <Button
                  onClick={() => {
                    setStep("email");
                    setCode("");
                    setError("");
                  }}
                  variant="ghost"
                  className="w-full text-gray-600 hover:text-gray-900"
                  disabled={isLoading}
                >
                  ← Voltar
                </Button>
              </div>
            )}

            {/* Password login step */}
            {step === "password" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Login com senha
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Digite suas credenciais de acesso
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pass-email" className="text-gray-700 font-medium">
                      Email
                    </Label>
                    <Input
                      id="pass-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="h-12 text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 font-medium">
                      Senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className="h-12 text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900 transition-colors"
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-12 text-base bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                    disabled={isLoading || !email || !password}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Entrando...
                      </>
                    ) : (
                      "Entrar"
                    )}
                  </Button>
                </form>

                <Button
                  onClick={() => {
                    setStep("method");
                    setEmail("");
                    setPassword("");
                    setError("");
                  }}
                  variant="ghost"
                  className="w-full text-gray-600 hover:text-gray-900"
                  disabled={isLoading}
                >
                  ← Voltar
                </Button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-600">
              Ao entrar, você concorda com nossos{" "}
              <a href="/terms" className="text-emerald-600 hover:text-emerald-700 font-semibold">
                Termos de Serviço
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
