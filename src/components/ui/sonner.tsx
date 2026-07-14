import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

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
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#0f172a", // slate-900
          "--normal-border": "#e2e8f0", // slate-200
          "--border-radius": "0.75rem", // rounded-xl, padrão do sistema
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "cn-toast shadow-lg border border-slate-200 rounded-xl px-4 py-3 font-medium",
          title: "text-sm text-slate-900",
          description: "text-sm text-slate-500",
          actionButton:
            "rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-medium px-3 py-1.5 hover:opacity-90 transition",
          cancelButton:
            "rounded-lg border border-slate-200 text-slate-600 text-xs font-medium px-3 py-1.5 hover:bg-slate-50 transition",
          closeButton:
            "border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50",
          // fundo claro e padronizado por tipo (mesma família de cores dos badges do sistema)
          success: "!bg-emerald-50 !border-emerald-200 !text-emerald-900",
          error: "!bg-red-50 !border-red-200 !text-red-900",
          warning: "!bg-amber-50 !border-amber-200 !text-amber-900",
          info: "!bg-blue-50 !border-blue-200 !text-blue-900",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
