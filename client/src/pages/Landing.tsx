// client/src/pages/Landing.tsx
import { useEffect } from "react";
import { redirectToLogin, logoutAndRedirect } from "@/lib/auth-utils";

export default function Landing() {
  useEffect(() => {
    const url = new URL(window.location.href);

    // Se alguém cair aqui vindo de link antigo do Replit:
    // /landing?logout=1 ou qualquer coisa parecida
    const shouldLogout =
      url.searchParams.get("logout") === "1" ||
      url.pathname.includes("logout");

    if (shouldLogout) {
      void logoutAndRedirect();
      return;
    }

    // Fluxo padrão: manda pro /login (UI)
    redirectToLogin();
  }, []);

  return null;
}
