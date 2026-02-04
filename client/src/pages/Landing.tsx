import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Check, 
  ArrowRight, 
  Star, 
  Shield, 
  Zap, 
  Users,
  Stethoscope,
  Brain,
  Clock,
  Award,
  TrendingUp,
  Heart,
  UserCheck,
  Sparkles,
  PlayCircle,
  FileText
} from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";

export default function Landing() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [animationStep, setAnimationStep] = useState(0);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  // Animation sequence
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % 3);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google/start";
  };

  const handleGetStarted = () => {
    navigate("/login");
  };

  const stats = [
    { number: "50K+", label: "Prescrições Geradas", icon: FileText },
    { number: "2,500+", label: "Médicos Ativos", icon: UserCheck },
    { number: "99.8%", label: "Uptime Garantido", icon: TrendingUp },
    { number: "24/7", label: "Suporte Médico", icon: Heart },
  ];

  const features = [
    { 
      icon: Brain, 
      title: "IA Médica Avançada", 
      desc: "Assistente inteligente com base em protocolos médicos validados",
      color: "from-purple-500 to-pink-500"
    },
    { 
      icon: Shield, 
      title: "Segurança Total", 
      desc: "Dados criptografados, LGPD compliant, backup automático",
      color: "from-green-500 to-emerald-500"
    },
    { 
      icon: Clock, 
      title: "Economia de Tempo", 
      desc: "Reduza 70% do tempo em documentação médica",
      color: "from-blue-500 to-cyan-500"
    },
    { 
      icon: Users, 
      title: "Colaboração", 
      desc: "Compartilhe protocolos e conhecimento com sua equipe",
      color: "from-orange-500 to-red-500"
    },
    { 
      icon: Stethoscope, 
      title: "Protocolos Atualizados", 
      desc: "Base de dados sempre atualizada com últimas evidências",
      color: "from-indigo-500 to-purple-500"
    },
    { 
      icon: Award, 
      title: "Certificação", 
      desc: "Validado por especialistas e sociedades médicas",
      color: "from-teal-500 to-green-500"
    },
  ];

  const testimonials = [
    {
      name: "Dr. Maria Silva",
      specialty: "Clínica Médica",
      avatar: "MS",
      text: "O Salva Plantão revolucionou minha prática. Economizo 2h por dia em documentação!"
    },
    {
      name: "Dr. João Santos",
      specialty: "Cardiologia",
      avatar: "JS", 
      text: "A IA é impressionante. Sugestões precisas baseadas em evidências científicas."
    },
    {
      name: "Dra. Ana Costa",
      specialty: "Pediatria",
      avatar: "AC",
      text: "Interface intuitiva e recursos completos. Indispensável no meu dia a dia."
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 px-4 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg">
              <span className="text-lg font-bold text-white">SP</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Salva Plantão</span>
            <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-700 border-emerald-200">
              v2.0
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            {!user && (
              <>
                <Button
                  onClick={handleGetStarted}
                  variant="ghost"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Entrar
                </Button>
                <Button
                  onClick={handleGoogleLogin}
                  className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white shadow-lg"
                >
                  <SiGoogle className="w-4 h-4 mr-2" />
                  Começar Grátis
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-gradient-to-r from-emerald-500 to-blue-500 text-white border-0">
              <Sparkles className="w-4 h-4 mr-1" />
              Nova Versão com IA Avançada
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              O Futuro da
              <span className="bg-gradient-to-r from-emerald-500 to-blue-600 bg-clip-text text-transparent">
                {" "}Medicina Digital
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Plataforma completa com IA médica, protocolos atualizados e ferramentas que economizam 
              <strong className="text-emerald-600"> 2+ horas por dia</strong> na sua prática clínica.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                onClick={handleGetStarted}
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white shadow-lg text-lg px-8 py-4"
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                Começar Agora - Grátis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                onClick={handleGoogleLogin}
                className="border-2 border-gray-300 hover:border-emerald-500 text-lg px-8 py-4"
              >
                <SiGoogle className="w-5 h-5 mr-2" />
                Login com Google
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
              {stats.map((stat, index) => (
                <Card key={index} className="border-0 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <stat.icon className="w-8 h-8 mx-auto mb-3 text-emerald-500" />
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stat.number}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Background Animation */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full opacity-10 animate-pulse" />
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-tr from-blue-400 to-emerald-500 rounded-full opacity-10 animate-pulse delay-1000" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200">
              Recursos Principais
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Tudo que você precisa em <span className="text-emerald-600">uma plataforma</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ferramentas completas para modernizar sua prática médica e melhorar o atendimento aos pacientes
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group hover:-translate-y-2"
              >
                <CardContent className="p-8">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">
              Depoimentos
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Médicos que <span className="text-emerald-600">confiam</span> em nós
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-bold mr-4">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.specialty}</div>
                    </div>
                  </div>
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 italic">"{testimonial.text}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-emerald-500 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Pronto para revolucionar sua prática médica?
          </h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de médicos que já economizam tempo e melhoram seus atendimentos
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleGetStarted}
              size="lg"
              className="bg-white text-emerald-600 hover:bg-gray-50 shadow-lg text-lg px-8 py-4 font-semibold"
            >
              Começar Gratuitamente
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleGoogleLogin}
              className="border-2 border-white text-white hover:bg-white hover:text-emerald-600 text-lg px-8 py-4"
            >
              <SiGoogle className="w-5 h-5 mr-2" />
              Login Rápido
            </Button>
          </div>
          
          <p className="text-emerald-100 mt-6 text-sm">
            ✓ Teste grátis por 30 dias  •  ✓ Sem cartão de crédito  •  ✓ Suporte 24/7
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg">
              <span className="text-lg font-bold text-white">SP</span>
            </div>
            <span className="text-xl font-bold text-white">Salva Plantão</span>
          </div>
          
          <p className="text-gray-400 mb-4">
            Plataforma médica digital líder no Brasil
          </p>
          
          <div className="flex items-center justify-center gap-6 text-sm">
            <span>© 2026 Salva Plantão</span>
            <span>•</span>
            <a href="mailto:suporte@appsalvaplantao.com" className="hover:text-emerald-400 transition-colors">
              Suporte
            </a>
            <span>•</span>
            <span>Desenvolvido com ❤️ para médicos</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
