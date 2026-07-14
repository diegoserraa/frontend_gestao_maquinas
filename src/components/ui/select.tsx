import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import {
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";

import { cn } from "@/lib/utils";

function Select(
  props: React.ComponentProps<typeof SelectPrimitive.Root>
) {
  return <SelectPrimitive.Root {...props} />;
}

function SelectGroup(
  props: React.ComponentProps<typeof SelectPrimitive.Group>
) {
  return <SelectPrimitive.Group {...props} />;
}

function SelectValue(
  props: React.ComponentProps<typeof SelectPrimitive.Value>
) {
  return <SelectPrimitive.Value {...props} />;
}

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        `
        flex
        h-11
        w-full
        items-center
        justify-between

        rounded-xl
        border
        border-slate-200

        bg-white

        px-4

        text-sm
        text-slate-700

        shadow-sm

        transition-all
        duration-200

        hover:border-slate-300
        hover:shadow-md

        focus:outline-none
        focus:ring-2
        focus:ring-blue-100
        focus:border-blue-500

        disabled:cursor-not-allowed
        disabled:opacity-50

        data-[placeholder]:text-slate-400

        [&_svg]:size-4
        [&_svg]:text-slate-500
        `,
        className
      )}
      {...props}
    >
      {children}

      <SelectPrimitive.Icon asChild>
        <ChevronDown />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position={position}
        className={cn(
          `
          z-50
          overflow-hidden

          rounded-xl

          border
          border-slate-200

          bg-white

          text-slate-700

          shadow-xl

          animate-in
          fade-in-0
          zoom-in-95

          data-[side=bottom]:slide-in-from-top-2
          data-[side=top]:slide-in-from-bottom-2

          min-w-[220px]
          `,
          className
        )}
        {...props}
      >
        <SelectScrollUpButton />

        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "w-full min-w-[var(--radix-select-trigger-width)]"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>

        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      className={cn(
        "px-3 py-2 text-xs font-medium text-slate-400",
        className
      )}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        `
        relative

        flex
        cursor-pointer
        items-center

        rounded-lg

        px-3
        py-2.5

        text-sm

        text-slate-700

        outline-none

        transition-colors

        hover:bg-slate-100
        focus:bg-slate-100

        data-[state=checked]:bg-blue-50
        data-[state=checked]:text-blue-700
        `,
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>
        {children}
      </SelectPrimitive.ItemText>

      <span className="absolute right-3 flex items-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      className={cn(
        "my-1 h-px bg-slate-100",
        className
      )}
      {...props}
    />
  );
}

function SelectScrollUpButton(
  props: React.ComponentProps<
    typeof SelectPrimitive.ScrollUpButton
  >
) {
  return (
    <SelectPrimitive.ScrollUpButton
      className="flex items-center justify-center py-1 bg-white"
      {...props}
    >
      <ChevronUp className="h-4 w-4 text-slate-500" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton(
  props: React.ComponentProps<
    typeof SelectPrimitive.ScrollDownButton
  >
) {
  return (
    <SelectPrimitive.ScrollDownButton
      className="flex items-center justify-center py-1 bg-white"
      {...props}
    >
      <ChevronDown className="h-4 w-4 text-slate-500" />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};