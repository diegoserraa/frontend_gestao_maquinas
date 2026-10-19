import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";


export default defineConfig({

  plugins: [

    react(),

    tailwindcss(),


    VitePWA({

      strategies: "injectManifest",

      srcDir: "src",

      filename: "service-worker.ts",

      registerType: "autoUpdate",

      injectRegister: "auto",


      manifest: {

        name: "MYMAQ360",

        short_name: "MYMAQ360",

        description:
          "Sistema de gestão de manutenção industrial",


        theme_color: "#2563eb",

        // igual ao fundo do ícone (branco): a splash não pisca outra cor antes do app carregar,
        // e o app em si é todo em fundo claro, então a transição fica no mesmo tom
        background_color: "#ffffff",


        display: "standalone",


        start_url: "/",


        icons: [

          // "any": cantos já arredondados, para navegador/desktop, onde ninguém recorta por cima
          {
            src: "/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },

          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },

          // "maskable": fundo quadrado até a borda e o desenho recuado numa área segura, porque o
          // Android aplica a própria máscara (círculo, "squircle" etc.) por cima deste arquivo
          {
            src: "/maskable-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },

          {
            src: "/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },

        ],

      },


      devOptions: {

        enabled: true,

      },


    }),

  ],



  resolve: {

    alias: {

      "@": path.resolve(__dirname, "./src"),

    },

  },

});