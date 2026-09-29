import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react"

import { useToastTheme } from "@/lib/toastTheme"

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useToastTheme()
  const escuro = theme === "dark"

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      gap={10}
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-emerald-600" />
        ),
        info: (
          <InfoIcon className="size-4 text-blue-600" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4 text-amber-600" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-red-600" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin text-slate-500" />
        ),
      }}
      style={
        (escuro
          ? {
              "--normal-bg": "#0f172a", // slate-900 — combina com a tela de Monitoramento
              "--normal-text": "#f1f5f9", // slate-100
              "--normal-border": "rgba(255,255,255,0.1)",
              "--border-radius": "0.75rem",
            }
          : {
              "--normal-bg": "#ffffff",
              "--normal-text": "#0f172a", // slate-900
              "--normal-border": "#e2e8f0", // slate-200
              "--border-radius": "0.75rem", // rounded-xl, padrão do sistema
            }) as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "cn-toast shadow-lg border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-medium",
          title: "text-sm text-slate-900 dark:text-slate-100",
          description: "text-sm text-slate-500 dark:text-slate-400",
          actionButton:
            "rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-medium px-3 py-1.5 hover:opacity-90 transition",
          cancelButton:
            "rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-medium px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-white/5 transition",
          closeButton:
            "border border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-white/5",
          // fundo claro e padronizado por tipo (mesma família de cores dos badges do sistema);
          // no escuro, mesma linguagem usada nos chips de status do Monitoramento
          // (bg bem sutil + texto na cor + sem borda gritante)
          success: escuro
            ? "!bg-emerald-500/10 !border-emerald-500/25 !text-emerald-300"
            : "!bg-emerald-50 !border-emerald-200 !text-emerald-900",
          error: escuro
            ? "!bg-rose-500/10 !border-rose-500/25 !text-rose-300"
            : "!bg-red-50 !border-red-200 !text-red-900",
          warning: escuro
            ? "!bg-amber-500/10 !border-amber-500/25 !text-amber-300"
            : "!bg-amber-50 !border-amber-200 !text-amber-900",
          info: escuro
            ? "!bg-blue-500/10 !border-blue-500/25 !text-blue-300"
            : "!bg-blue-50 !border-blue-200 !text-blue-900",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
