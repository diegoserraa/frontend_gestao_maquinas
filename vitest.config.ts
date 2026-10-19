import { defineConfig } from "vitest/config";
import path from "node:path";

// Testes da lógica pura do front (regras de permissão, botões da O.S., store). Sem navegador.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
