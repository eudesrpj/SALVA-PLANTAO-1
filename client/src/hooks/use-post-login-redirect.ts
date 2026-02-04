import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook para redirecionamento pós-login baseado no status de assinatura
 */
export function usePostLoginRedirect() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const redirectAfterLogin = async () => {
    try {
      // Invalidar queries para garantir dados frescos
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/preview/status"] });
      
      // Aguardar um pouco para as queries serem resolvidas
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Buscar status de assinatura
      const subscriptionStatus = await queryClient.fetchQuery({ 
        queryKey: ["/api/preview/status"] 
      });
      
      const userData = await queryClient.fetchQuery({ 
        queryKey: ["/api/auth/me"] 
      });
      
      const isAdmin = userData?.role === "admin";
      const hasActiveSubscription = subscriptionStatus?.isSubscribed || isAdmin;
      
      // Redirecionar baseado no status de assinatura
      if (hasActiveSubscription) {
        navigate("/dashboard");
      } else {
        navigate("/subscribe");
      }
    } catch (error) {
      console.error("Error during post-login redirect:", error);
      // Em caso de erro, ir para subscribe por segurança
      navigate("/subscribe");
    }
  };

  return { redirectAfterLogin };
}