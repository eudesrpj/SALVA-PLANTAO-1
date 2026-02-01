import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";
import { tokenStorage } from "@/lib/queryClient";

async function fetchUser(): Promise<User | null> {
  const headers: Record<string, string> = {};
  
  // SEMPRE enviar token via header
  const token = tokenStorage.get();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const response = await fetch("/api/auth/me", {
    credentials: "include",
    headers,
  });

  if (response.status === 401) {
    console.log("❌ Não autenticado (401)");
    tokenStorage.clear();
    return null;
  }

  if (!response.ok) {
    console.error(`❌ Erro ao buscar usuário: ${response.status}`);
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("✓ Usuário carregado:", data.email);
  
  // Transformar resposta de /api/auth/me para formato User
  return {
    id: data.userId,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    role: data.role,
    status: data.status || "active",
    profileImageUrl: data.profileImageUrl || null,
  } as User;
}

async function logout(): Promise<void> {
  const headers: Record<string, string> = {};
  const token = tokenStorage.get();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
    headers,
  });
  
  // Limpar token do localStorage
  tokenStorage.clear();
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
