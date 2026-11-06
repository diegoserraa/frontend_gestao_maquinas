import * as React from "react";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";

import { cn } from "@/lib/utils";

function HoverCard(props: React.ComponentProps<typeof HoverCardPrimitive.Root>) {
  return <HoverCardPrimitive.Root {...props} />;
}

function HoverCardTrigger(
  props: React.ComponentProps<typeof HoverCardPrimitive.Trigger>
) {
  return <HoverCardPrimitive.Trigger {...props} />;
}

function HoverCardContent({
  className,
  align = "center",
  sideOffset = 8,
  collisionPadding = 12,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          `
          z-50
          rounded-xl
          border border-slate-200
          bg-white
          p-3
          shadow-xl
          outline-none

          animate-in
          fade-in-0
          zoom-in-95

          data-[side=bottom]:slide-in-from-top-2
          data-[side=top]:slide-in-from-bottom-2
          data-[side=left]:slide-in-from-right-2
          data-[side=right]:slide-in-from-left-2
          `,
          className
        )}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  );
}

export { HoverCard, HoverCardTrigger, HoverCardContent };
