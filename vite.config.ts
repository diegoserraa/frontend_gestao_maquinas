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

        name: "ZDM Solutions",

        short_name: "ZDM",

        description:
          "Sistema de gestão de manutenção industrial",


        theme_color: "#2563eb",

        background_color: "#ffffff",


        display: "standalone",


        start_url: "/",


        icons: [

          {
            src: "/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
          },


          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
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