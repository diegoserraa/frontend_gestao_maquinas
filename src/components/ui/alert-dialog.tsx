import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import { AlertTriangle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/* ROOT */
function AlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root {...props} />
}

/* TRIGGER */
function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return <AlertDialogPrimitive.Trigger {...props} />
}

/* PORTAL */
function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return <AlertDialogPrimitive.Portal {...props} />
}

/* OVERLAY */
function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50",
        "bg-slate-900/50 backdrop-blur-[2px]",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

/* CONTENT — alinhado ao padrão visual do MachineModal */
function AlertDialogContent({
  className,
  variant = "default",
  children,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content> & {
  /** controla a cor da barra de destaque e do ícone */
  variant?: "default" | "destructive"
}) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />

      <AlertDialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50",
          "w-[calc(100%-2rem)] max-w-md",
          "-translate-x-1/2 -translate-y-1/2",

          "bg-white text-slate-900",
          "border border-slate-200",
          "shadow-2xl",

          "rounded-2xl overflow-hidden",

          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",

          "focus:outline-none",
          className
        )}
        data-variant={variant}
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Content>
    </AlertDialogPortal>
  )
}

/* HEADER — accent bar igual ao MachineModal, com ícone opcional de alerta */
function AlertDialogHeader({
  className,
  variant = "default",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "default" | "destructive"
}) {
  const accent =
    variant === "destructive"
      ? "from-red-500 to-rose-500"
      : "from-blue-500 to-indigo-500"

  const iconWrap =
    variant === "destructive"
      ? "bg-red-50 text-red-600"
      : "bg-blue-50 text-blue-600"

  return (
    <div
      className={cn(
        "border-b border-slate-100 px-6 py-5 text-left",
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        {variant === "destructive" ? (
          <div className={cn("shrink-0 rounded-full p-2", iconWrap)}>
            <AlertTriangle size={18} />
          </div>
        ) : null}
        <div className="min-w-0 space-y-1 pt-0.5">{children}</div>
      </div>
    </div>
  )
}

/* TITLE */
function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      className={cn(
        "text-base font-semibold leading-snug text-slate-900",
        className
      )}
      {...props}
    />
  )
}

/* DESCRIPTION */
function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      className={cn(
        "text-sm text-slate-500 leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

/* FOOTER */
function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2",
        "px-6 py-4",
        "bg-slate-50/60",
        "border-t border-slate-100",
        className
      )}
      {...props}
    />
  )
}

/* ACTION — variante destructive fica vermelha de fato */
function AlertDialogAction({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action> &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
  const isDestructive = variant === "destructive"

  return (
    <Button asChild variant={variant} size={size}>
      <AlertDialogPrimitive.Action
        className={cn(
          "rounded-xl font-medium",
          isDestructive
            ? "bg-red-600 hover:bg-red-700 text-white shadow-sm"
            : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:opacity-90",
          "active:scale-[0.98] transition-all",
          className
        )}
        {...props}
      />
    </Button>
  )
}

/* CANCEL */
function AlertDialogCancel({
  className,
  variant = "outline",
  size = "default",
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel> &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
  return (
    <Button asChild variant={variant} size={size}>
      <AlertDialogPrimitive.Cancel
        className={cn(
          "rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50",
          "active:scale-[0.98] transition-all",
          className
        )}
        {...props}
      />
    </Button>
  )
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
