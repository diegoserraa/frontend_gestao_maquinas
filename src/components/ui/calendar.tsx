import * as React from "react"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type Locale,
} from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "lucide-react"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  locale,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar bg-white rounded-xl p-3 [--cell-radius:12px]",
        className
      )}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit bg-white", defaultClassNames.root),

        months: cn(
          "relative flex flex-col gap-4",
          defaultClassNames.months
        ),

        month: cn(
          "flex w-full flex-col gap-4",
          defaultClassNames.month
        ),

        nav: cn(
          "absolute inset-x-0 top-0 flex items-center justify-between",
          defaultClassNames.nav
        ),

        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 border border-slate-200 bg-white hover:bg-slate-100 shadow-none",
          defaultClassNames.button_previous
        ),

        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 border border-slate-200 bg-white hover:bg-slate-100 shadow-none",
          defaultClassNames.button_next
        ),

        month_caption: cn(
          "flex h-9 items-center justify-center",
          defaultClassNames.month_caption
        ),

        caption_label: cn(
          "text-sm font-semibold text-slate-800",
          defaultClassNames.caption_label
        ),

        month_grid: cn(
          "w-full border-collapse",
          defaultClassNames.month_grid
        ),

        weekdays: cn(
          "flex",
          defaultClassNames.weekdays
        ),

        weekday: cn(
          "flex-1 text-xs font-medium text-slate-500",
          defaultClassNames.weekday
        ),

        week: cn(
          "mt-1 flex w-full",
          defaultClassNames.week
        ),

        day: cn(
          "relative h-9 w-9 p-0 text-center",
          defaultClassNames.day
        ),

        today: cn(
          "bg-slate-100 text-slate-900 rounded-lg font-semibold",
          defaultClassNames.today
        ),

        outside: cn(
          "text-slate-300",
          defaultClassNames.outside
        ),

        disabled: cn(
          "opacity-40",
          defaultClassNames.disabled
        ),

        hidden: cn(
          "invisible",
          defaultClassNames.hidden
        ),

        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => (
          <div
            ref={rootRef}
            data-slot="calendar"
            className={cn(className)}
            {...props}
          />
        ),

        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon
                className={cn("h-4 w-4", className)}
                {...props}
              />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("h-4 w-4", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon
              className={cn("h-4 w-4", className)}
              {...props}
            />
          )
        },

        DayButton: ({ ...props }) => (
          <CalendarDayButton locale={locale} {...props} />
        ),

        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & {
  locale?: Partial<Locale>
}) {
  const ref = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (modifiers.focused) {
      ref.current?.focus()
    }
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      className={cn(
        `
        h-9
        w-9
        rounded-lg
        border-0

        hover:bg-slate-100
        hover:text-slate-900

        focus:outline-none
        focus:ring-0

        data-[selected-single=true]:bg-blue-600
        data-[selected-single=true]:text-white
        data-[selected-single=true]:hover:bg-blue-700
        `,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }