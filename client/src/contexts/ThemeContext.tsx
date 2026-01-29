import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export type Theme = "light" | "dark" | "system";
export type ColorScheme = "blue" | "green" | "purple" | "orange" | "red" | "indigo" | "pink" | "cyan";
export type FontSize = "small" | "medium" | "large" | "xlarge";

interface ThemePreferences {
  theme: Theme;
  colorScheme: ColorScheme;
  fontSize: FontSize;
  compactMode: boolean;
  notificationsEnabled?: boolean;
  emailNotifications?: boolean;
  soundEnabled?: boolean;
}

interface ThemeContextType extends ThemePreferences {
  setTheme: (theme: Theme) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  setFontSize: (size: FontSize) => void;
  setCompactMode: (compact: boolean) => void;
  isLoading: boolean;
}

const defaultPrefs: ThemePreferences = {
  theme: "system",
  colorScheme: "blue",
  fontSize: "medium",
  compactMode: false,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const COLOR_SCHEMES: Record<ColorScheme, { primary: string; accent: string; ring: string }> = {
  blue: { primary: "201 96% 32%", accent: "199 89% 48%", ring: "201 96% 32%" },
  green: { primary: "142 76% 36%", accent: "142 69% 58%", ring: "142 76% 36%" },
  purple: { primary: "262 83% 58%", accent: "270 95% 75%", ring: "262 83% 58%" },
  orange: { primary: "25 95% 53%", accent: "32 98% 59%", ring: "25 95% 53%" },
  red: { primary: "0 84% 60%", accent: "0 93% 69%", ring: "0 84% 60%" },
  indigo: { primary: "226 71% 40%", accent: "226 72% 55%", ring: "226 71% 40%" },
  pink: { primary: "330 81% 60%", accent: "330 81% 70%", ring: "330 81% 60%" },
  cyan: { primary: "188 94% 34%", accent: "190 93% 50%", ring: "188 94% 34%" },
};

const FONT_SIZES: Record<FontSize, string> = {
  small: "14px",
  medium: "16px",
  large: "18px",
  xlarge: "20px",
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [localPrefs, setLocalPrefs] = useState<ThemePreferences>(() => {
    const saved = localStorage.getItem("theme-prefs");
    return saved ? { ...defaultPrefs, ...JSON.parse(saved) } : defaultPrefs;
  });
  const [optimisticPrefs, setOptimisticPrefs] = useState<ThemePreferences | null>(null);

  const { data: serverPrefs, isLoading } = useQuery<ThemePreferences>({
    queryKey: ["/api/user-preferences"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/user-preferences", { credentials: "include" });
        if (res.status === 404 || res.status === 401) return null;
        if (!res.ok) throw new Error("Failed");
        return res.json();
      } catch (error) {
        console.warn("Erro ao carregar preferências do servidor:", error);
        return null;
      }
    },
    enabled: isAuthenticated,
    retry: false,
  });

  const updatePrefs = useMutation({
    mutationFn: async (prefs: Partial<ThemePreferences>) => {
      try {
        const res = await fetch("/api/user-preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(prefs),
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to update");
        return res.json();
      } catch (error) {
        console.warn("Erro ao salvar preferências:", error);
        return null; // Falha silenciosa - continua com local
      }
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(["/api/user-preferences"], data);
      }
      setOptimisticPrefs(null);
    },
    onError: () => {
      setOptimisticPrefs(null); // Volta ao estado anterior
    },
  });

  const prefs = optimisticPrefs || (isAuthenticated && serverPrefs ? serverPrefs : localPrefs);
  
  // Garantir que prefs sempre tem valores válidos
  const safePrefs: ThemePreferences = prefs ? {
    theme: (prefs.theme as Theme) || "system",
    colorScheme: (prefs.colorScheme as ColorScheme) || "blue",
    fontSize: (prefs.fontSize as FontSize) || "medium",
    compactMode: prefs.compactMode ?? false,
  } : defaultPrefs;

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    root.classList.toggle("dark", isDark);
  };

  const applyColorScheme = (scheme: ColorScheme) => {
    const root = document.documentElement;
    const colors = COLOR_SCHEMES[scheme];
    
    // Fallback para blue se scheme for inválido
    if (!colors) {
      console.warn(`Scheme inválido: ${scheme}, usando blue`);
      const defaultColors = COLOR_SCHEMES.blue;
      root.style.setProperty("--primary", defaultColors.primary);
      root.style.setProperty("--accent", defaultColors.accent);
      root.style.setProperty("--ring", defaultColors.ring);
      return;
    }
    
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--accent", colors.accent);
    root.style.setProperty("--ring", colors.ring);
  };

  const applyFontSize = (size: FontSize) => {
    document.documentElement.style.fontSize = FONT_SIZES[size];
  };

  useEffect(() => {
    applyTheme(safePrefs.theme);
    applyColorScheme(safePrefs.colorScheme);
    applyFontSize(safePrefs.fontSize);
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (safePrefs.theme === "system") {
        applyTheme("system");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [safePrefs.theme, safePrefs.colorScheme, safePrefs.fontSize]);

  const updatePreference = (update: Partial<ThemePreferences>) => {
    // SEMPRE atualiza local imediatamente para feedback visual
    const newPrefs = { ...safePrefs, ...update };
    setLocalPrefs(newPrefs);
    localStorage.setItem("theme-prefs", JSON.stringify(newPrefs));
    
    // Se autenticado, tenta sincronizar com servidor (background)
    if (isAuthenticated) {
      setOptimisticPrefs(newPrefs);
      updatePrefs.mutate(update);
    }
  };

  return (
    <ThemeContext.Provider value={{
      ...safePrefs,
      setTheme: (theme) => updatePreference({ theme }),
      setColorScheme: (colorScheme) => updatePreference({ colorScheme }),
      setFontSize: (fontSize) => updatePreference({ fontSize }),
      setCompactMode: (compactMode) => updatePreference({ compactMode }),
      isLoading,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
