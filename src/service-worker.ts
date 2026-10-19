/// <reference lib="webworker" />

import { precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(
  self.__WB_MANIFEST
);

/*
 * Sem isto, o botão "Deseja atualizar agora?" (main.tsx, onNeedRefresh) fica
 * decorativo: `updateSW(true)` manda a mensagem SKIP_WAITING pro service worker
 * novo, mas sem um listener aqui pra escutar essa mensagem, ele nunca chama
 * self.skipWaiting() — a versão nova fica "esperando" pra sempre, e quem clica
 * em "atualizar" só recarrega a página com a MESMA versão antiga de novo. Era
 * exatamente esse o motivo de uma correção já publicada não aparecer pra quem
 * já tinha a aba aberta.
 */
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// e sem isto, mesmo depois de ativar, o service worker novo só passa a
// controlar ABAS NOVAS — uma aba que já estava aberta continua sendo servida
// pelo antigo até ser fechada e reaberta. clients.claim() assume o controle
// das abas já abertas na hora, pro F5 do "atualizar agora" valer de verdade.
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener(
  "push",
  (event) => {

    if (!event.data) {
      return;
    }

    const data = event.data.json();

    event.waitUntil(
      self.registration.showNotification(
        data.title,
        {
          body: data.body,
          icon: "/pwa-192.png",
          badge: "/pwa-192.png",
          data: {
            url: data.url
          }
        }
      )
    );
  }
);

self.addEventListener(
  "notificationclick",
  (event) => {

    event.notification.close();

    const url =
      event.notification.data?.url || "/";

    event.waitUntil(
      self.clients.openWindow(url)
    );
  }
);