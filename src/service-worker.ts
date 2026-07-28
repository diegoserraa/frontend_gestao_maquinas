/// <reference lib="webworker" />

import { precacheAndRoute } from "workbox-precaching";


declare const self: ServiceWorkerGlobalScope;


precacheAndRoute(
  self.__WB_MANIFEST
);



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
          body: data.message,
          icon: "/pwa-192.png",
          badge: "/pwa-192.png",
        }
      )

    );

  }
);