import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Link2, Unlink2, Mail, Chrome } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AuthIdentity {
  id: number;
  provider: "email" | "google" | "apple";
  email: string;
  createdAt: string;
}

const providerIcons: Record<string, JSX.Element> = {
  email: <Mail className="w-5 h-5 text-blue-600" />,
  google: <Chrome className="w-5 h-5 text-red-600" />,
  apple: <Chrome className="w-5 h-5 text-black" />,
};

const providerLabels: Record<string, string> = {
  email: "Email",
  google: "Google",
  apple: "Apple",
};

export function LinkedAccounts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [unlinkingId, setUnlinkingId] = useState<number | null>(null);

  // Fetch linked accounts
  const { data: identities, isLoading } = useQuery<AuthIdentity[]>({
    queryKey: ["/api/auth/identities"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/auth/identities");
      return res || [];
    },
  });

  // Unlink account mutation
  const unlinkMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/auth/identities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/identities"] });
      toast({
        title: "Conta desvinculada",
        description: "A conta foi removida com sucesso",
      });
      setUnlinkingId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao desvincular",
        description: error?.message || "Não foi possível desvincular a conta",
        variant: "destructive",
      });
    },
  });

  const handleUnlink = (id: number) => {
    if ((identities?.length || 0) <= 1) {
      toast({
        title: "Não é possível desvincular",
        description: "Você deve manter pelo menos um método de autenticação",
        variant: "destructive",
      });
      return;
    }

    setUnlinkingId(id);
    unlinkMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" /> Contas Vinculadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" /> Contas Vinculadas
        </CardTitle>
        <CardDescription>
          Gerencie os métodos de autenticação vinculados à sua conta
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!identities || identities.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>Nenhuma conta vinculada encontrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {identities.map((identity) => (
              <div
                key={identity.id}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {providerIcons[identity.provider]}
                  <div>
                    <p className="font-medium text-slate-900">
                      {providerLabels[identity.provider]}
                    </p>
                    <p className="text-sm text-slate-500">{identity.email}</p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnlink(identity.id)}
                  disabled={
                    (identities.length || 0) <= 1 ||
                    unlinkingId === identity.id ||
                    unlinkMutation.isPending
                  }
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Unlink2 className="w-4 h-4 mr-2" />
                  {unlinkingId === identity.id ? "Desvinculando..." : "Desvincular"}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Link new account section */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-sm font-medium text-slate-700 mb-4">
            Vincular nova conta
          </p>
          <div className="grid gap-3">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => (window.location.href = "/api/auth/google/start")}
            >
              <Chrome className="w-5 h-5 mr-2" /> Vincular Google
            </Button>
            <Button
              variant="outline"
              className="justify-start text-slate-600"
              disabled
            >
              <Mail className="w-5 h-5 mr-2" /> Vincular Email (em breve)
            </Button>
          </div>
        </div>

        <p className="text-xs text-slate-500 mt-4">
          Dica: Você pode manter múltiplos métodos de autenticação para maior segurança
        </p>
      </CardContent>
    </Card>
  );
}
