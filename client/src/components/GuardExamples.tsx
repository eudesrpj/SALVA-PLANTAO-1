import { useAuthGuard, useCanAccess, useSubscriptionStatus } from "@/hooks/use-auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Shield, User, AlertTriangle } from "lucide-react";

/**
 * Exemplo de componente usando o guard centralizado
 */
export function ProtectedFeature() {
  const { canAccess, isLoading } = useAuthGuard({ 
    level: "subscribed",
    redirectOnFail: false 
  });

  if (isLoading) {
    return <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />;
  }

  if (!canAccess) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-amber-700">
            <Crown className="h-4 w-4" />
            <span>Feature Premium - Necessário plano ativo</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          Feature Premium Desbloqueada
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>Conteúdo exclusivo para usuários com assinatura ativa!</p>
      </CardContent>
    </Card>
  );
}

/**
 * Exemplo de componente condicional simples
 */
export function ConditionalButton() {
  const canAccessPremium = useCanAccess("subscribed");
  const { hasActiveSubscription, isAdmin } = useSubscriptionStatus();

  return (
    <div className="space-y-2">
      <Button variant={canAccessPremium ? "default" : "outline"}>
        {canAccessPremium ? "Acessar Feature Premium" : "Upgrade para Premium"}
      </Button>
      
      <div className="text-sm text-muted-foreground">
        Status: {isAdmin ? "Admin" : hasActiveSubscription ? "Premium" : "Free"}
      </div>
    </div>
  );
}

/**
 * Exemplo de componente administrativo
 */
export function AdminPanel() {
  const { canAccess, isLoading } = useAuthGuard({ 
    level: "admin",
    redirectOnFail: false 
  });

  if (isLoading) {
    return <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />;
  }

  if (!canAccess) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <span>Acesso restrito - Apenas administradores</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          Painel Administrativo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>Ferramentas exclusivas para administradores.</p>
        <Button className="mt-2">Gerenciar Sistema</Button>
      </CardContent>
    </Card>
  );
}