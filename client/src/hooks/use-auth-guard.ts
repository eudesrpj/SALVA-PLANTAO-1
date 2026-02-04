import { useAuth } from "./use-auth";
import { usePreviewStatus } from "@/components/PreviewGate";
import { useLocation } from "wouter";
import { useEffect } from "react";

export type AuthGuardLevel = "public" | "authenticated" | "subscribed" | "admin";

export interface AuthGuardOptions {
  level: AuthGuardLevel;
  redirectTo?: string;
  redirectOnFail?: boolean;
}

export interface AuthGuardResult {
  canAccess: boolean;
  isLoading: boolean;
  user: any;
  isAuthenticated: boolean;
  isSubscribed: boolean;
  shouldRedirect: boolean;
  redirectUrl: string | null;
  authLevel: AuthGuardLevel;
}

/**
 * Hook centralizado para guards de autenticação e assinatura
 * Combina verificação de auth + subscription em uma única interface
 */
export function useAuthGuard(options: AuthGuardOptions): AuthGuardResult {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { isSubscribed, isLoading: previewLoading } = usePreviewStatus();
  const [, navigate] = useLocation();

  const isLoading = authLoading || previewLoading;
  const isAdmin = user?.role === "admin";

  // Determinar se pode acessar baseado no nível requerido
  const canAccess = (() => {
    switch (options.level) {
      case "public":
        return true;
      case "authenticated":
        return isAuthenticated;
      case "subscribed":
        return isAuthenticated && (isSubscribed || isAdmin);
      case "admin":
        return isAuthenticated && isAdmin;
      default:
        return false;
    }
  })();

  // Determinar URL de redirecionamento
  const getRedirectUrl = (): string | null => {
    if (options.redirectTo) {
      return options.redirectTo;
    }

    // URLs padrão baseadas no estado
    if (!isAuthenticated) {
      return "/login";
    }

    if (options.level === "subscribed" && !isSubscribed && !isAdmin) {
      return "/plans";
    }

    if (options.level === "admin" && !isAdmin) {
      return "/dashboard";
    }

    return null;
  };

  const shouldRedirect = !canAccess && !isLoading && options.redirectOnFail !== false;
  const redirectUrl = shouldRedirect ? getRedirectUrl() : null;

  // Auto-redirect se necessário
  useEffect(() => {
    if (shouldRedirect && redirectUrl) {
      navigate(redirectUrl);
    }
  }, [shouldRedirect, redirectUrl, navigate]);

  return {
    canAccess,
    isLoading,
    user,
    isAuthenticated,
    isSubscribed: isSubscribed || isAdmin,
    shouldRedirect,
    redirectUrl,
    authLevel: options.level,
  };
}

/**
 * Hook simplificado para componentes que só precisam saber se podem acessar
 */
export function useCanAccess(level: AuthGuardLevel): boolean {
  const { canAccess, isLoading } = useAuthGuard({ level, redirectOnFail: false });
  return !isLoading && canAccess;
}

/**
 * Hook para verificação de assinatura sem redirecionamento
 */
export function useSubscriptionStatus() {
  const { user } = useAuth();
  const { isSubscribed } = usePreviewStatus();
  const isAdmin = user?.role === "admin";
  
  return {
    hasActiveSubscription: isSubscribed || isAdmin,
    isAdmin,
    isPaidUser: isSubscribed,
    canAccessPremiumFeatures: isSubscribed || isAdmin,
  };
}