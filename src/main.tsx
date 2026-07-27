import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";

import { registerSW } from "virtual:pwa-register";

import "./index.css";

// Registra o Service Worker do PWA
registerSW({
  onNeedRefresh() {
    console.log("Nova versão disponível. Atualize o aplicativo.");
  },

  onOfflineReady() {
    console.log("Aplicação pronta para funcionar offline.");
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
);