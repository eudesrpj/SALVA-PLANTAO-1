import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { tokenStorage } from "@/lib/queryClient";

export default function AuthCallback() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    tokenStorage.set(token);
    setStatus("success");

    const timer = setTimeout(() => {
      navigate("/");
    }, 1200);

    return () => clearTimeout(timer);
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="auth-callback-page">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            Salva Plantão
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          {status === "error" ? (
            <>
              <XCircle className="w-16 h-16 text-destructive mb-4" />
              <p className="text-lg font-medium text-center mb-2">Falha no login</p>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Não foi possível completar o login. Tente novamente.
              </p>
              <Button onClick={() => navigate("/login")} data-testid="button-go-login">
                Ir para login
              </Button>
            </>
          ) : status === "success" ? (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <p className="text-lg font-medium text-center mb-2">Login realizado!</p>
              <p className="text-sm text-muted-foreground text-center">
                Redirecionando...
              </p>
            </>
          ) : (
            <>
              <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
              <p className="text-lg font-medium text-center mb-2">Finalizando login...</p>
              <p className="text-sm text-muted-foreground text-center">
                Aguarde um momento
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
