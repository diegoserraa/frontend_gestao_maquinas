import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

function TooltipProvider({
  delayDuration = 150,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipPrimitive.Root
      data-slot="tooltip"
      {...props}
    />
  );
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      {...props}
    />
  );
}

function TooltipContent({
  className,
  sideOffset = 8,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          [
            "z-50",
            "w-fit",
            "max-w-[320px]",
            "rounded-xl",
            "border",
            "border-slate-700/70",
            "bg-slate-950/95",
            "px-3.5",
            "py-2.5",
            "text-xs",
            "leading-relaxed",
            "font-medium",
            "text-slate-100",
            "shadow-xl",
            "shadow-slate-950/20",
            "backdrop-blur-md",
            "select-none",

            // Animação
            "origin-(--radix-tooltip-content-transform-origin)",
            "data-[state=delayed-open]:animate-in",
            "data-[state=delayed-open]:fade-in-0",
            "data-[state=delayed-open]:zoom-in-95",
            "data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0",
            "data-[state=closed]:zoom-out-95",

            // Animações direcionais
            "data-[side=bottom]:slide-in-from-top-1",
            "data-[side=left]:slide-in-from-right-1",
            "data-[side=right]:slide-in-from-left-1",
            "data-[side=top]:slide-in-from-bottom-1",
          ].join(" "),
          className
        )}
        {...props}
      >
        <div className="relative">
          {children}
        </div>

        <TooltipPrimitive.Arrow
          width={10}
          height={5}
          className="fill-slate-950"
        />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
};