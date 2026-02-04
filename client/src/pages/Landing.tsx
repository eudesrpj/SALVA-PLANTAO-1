import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Star, Shield, Zap, Users } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

export default function Landing() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google/start";
  };

  const features = [
    { icon: Zap, title: "IA Avançada", desc: "Assistente médico inteligente para prescrições e diagnósticos" },
    { icon: Shield, title: "Seguro & Confiável", desc: "Dados criptografados e backup automático" },
    { icon: Users, title: "Colaborativo", desc: "Compartilhe protocolos e receitas com sua equipe" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 px-4 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg">
              <span className="text-lg font-bold text-white">SP</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Salva Plantão</span>
          </div>
          <div className="flex items-center gap-3">
            {!user && (
              <Button
                onClick={handleGoogleLogin}
                variant="outline"
                className="border-2"
              >
                <SiGoogle className="w-4 h-4 mr-2" />
                Entrar com Google
              </Button>
            )}
            <Button onClick={() => navigate(user ? "/" : "/login")} variant="ghost" className="text-gray-700 hover:text-gray-900">
              {user ? "Minha conta" : "Entrar"}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-200/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-blue-200/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-6">
              <Star className="w-4 h-4 fill-emerald-600" />
              <span>Plataforma #1 para médicos de plantão</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Seu assistente médico
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent"> inteligente</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Prescrições, protocolos, IA médica e muito mais. Tudo em um só lugar para otimizar seu plantão.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleGoogleLogin}
                size="lg"
                className="h-14 px-8 text-lg bg-white text-gray-900 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-lg"
              >
                <SiGoogle className="w-5 h-5 mr-3" />
                Começar com Google
              </Button>
              
              <Button
                onClick={() => navigate("/login")}
                size="lg"
                className="h-14 px-8 text-lg bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white transition-all shadow-xl hover:shadow-2xl"
              >
                Criar conta grátis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            <p className="text-sm text-gray-500 mt-4">
              Teste grátis por 7 dias. Depois apenas <span className="font-bold text-emerald-600">R$ 29,90/mês</span>
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-20">
            {features.map((feature, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Plano único e simples</h2>
            <p className="text-xl text-gray-600">Acesso completo a todas as funcionalidades</p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-3xl p-8 shadow-2xl border-2 border-emerald-200">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Plano Mensal</h3>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-gray-900">R$ 29</span>
                  <span className="text-2xl text-gray-600">,90</span>
                  <span className="text-gray-600">/mês</span>
                </div>
                <p className="text-sm text-emerald-600 font-semibold mt-2">7 dias grátis para testar</p>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  "Prescrições inteligentes com IA",
                  "Protocolos médicos atualizados",
                  "Calculadoras médicas",
                  "Biblioteca de medicamentos",
                  "Interconsulta com IA",
                  "Sincronização em tempo real",
                  "Suporte prioritário"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => navigate("/plans")}
                size="lg"
                className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white transition-all shadow-lg hover:shadow-xl"
              >
                Assinar agora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <p className="text-xs text-center text-gray-600 mt-4">
                Pagamento seguro via Asaas • Cancele a qualquer momento
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-600">
          <p>© 2026 Salva Plantão. Todos os direitos reservados.</p>
          <p className="mt-2">
            <a href="/terms" className="text-emerald-600 hover:text-emerald-700">Termos de Serviço</a>
            {" · "}
            <a href="/privacy" className="text-emerald-600 hover:text-emerald-700">Privacidade</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
