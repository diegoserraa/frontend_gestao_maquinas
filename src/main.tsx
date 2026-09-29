import "./lib/authFetch"; // anexa o token em toda chamada pra API — ver o arquivo

import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";

import { ThemeProvider } from "next-themes";

import { TooltipProvider } from "@/components/ui/tooltip";
import { InstalarAppBanner } from "@/components/pwa/InstalarAppBanner";

import { registerSW } from "virtual:pwa-register";

import "./index.css";

let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined;

updateSW = registerSW({
  immediate: true,

  onNeedRefresh() {
    const atualizar = window.confirm(
      "Uma nova versão do sistema está disponível. Deseja atualizar agora?"
    );

    if (atualizar && updateSW) {
      updateSW(true);
    }
  },

  onOfflineReady() {
    console.log("Aplicação pronta para funcionar offline.");
  },

  onRegisteredSW(swUrl, registration) {
    console.log("Service Worker registrado:", swUrl);

    if (registration) {
      setInterval(() => {
        registration.update();
      }, 60 * 1000);
    }
  },

  onRegisterError(error) {
    console.error("Erro ao registrar Service Worker:", error);
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  // só serve pro Toaster (sonner) hoje — nenhuma outra tela do sistema tem
  // modo escuro, então fica fixo em "light" por padrão; só a tela de
  // Monitoramento chama setTheme() pra combinar o toast com o tema dela
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <TooltipProvider>
      <RouterProvider router={router} />
      <InstalarAppBanner />
    </TooltipProvider>
  </ThemeProvider>
);