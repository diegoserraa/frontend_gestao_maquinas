import { useEffect, useState, type ChangeEvent } from "react";
import { CalendarDays, X } from "lucide-react";
import { format, isValid, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DateInputProps = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function DateInput({
  value = "",
  onChange,
  placeholder = "dd/mm/aaaa",
  disabled = false,
  className = "",
}: DateInputProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [inputValue, setInputValue] = useState(() => {
    if (!value) {
      return "";
    }

    const date = new Date(`${value}T00:00:00`);

    if (!isValid(date)) {
      return "";
    }

    return format(date, "dd/MM/yyyy");
  });

  const selectedDate = value
    ? new Date(`${value}T00:00:00`)
    : undefined;

  useEffect(() => {
    if (!value) {
      setInputValue("");
      return;
    }

    const date = new Date(`${value}T00:00:00`);

    if (isValid(date)) {
      setInputValue(format(date, "dd/MM/yyyy"));
    }
  }, [value]);

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    let numbers = event.target.value.replace(/\D/g, "");

    if (numbers.length > 8) {
      numbers = numbers.slice(0, 8);
    }

    let formatted = numbers;

    if (numbers.length > 4) {
      formatted =
        numbers.slice(0, 2) +
        "/" +
        numbers.slice(2, 4) +
        "/" +
        numbers.slice(4);
    } else if (numbers.length > 2) {
      formatted =
        numbers.slice(0, 2) +
        "/" +
        numbers.slice(2);
    }

    setInputValue(formatted);

    if (numbers.length === 0) {
      onChange("");
      return;
    }

    if (numbers.length === 8) {
      const parsed = parse(
        formatted,
        "dd/MM/yyyy",
        new Date()
      );

      if (isValid(parsed)) {
        onChange(format(parsed, "yyyy-MM-dd"));
      }
    }
  };

  const handleCalendarSelect = (
    date: Date | undefined
  ) => {
    if (!date) {
      setInputValue("");
      onChange("");
      setCalendarOpen(false);
      return;
    }

    const displayValue = format(date, "dd/MM/yyyy");
    const filterValue = format(date, "yyyy-MM-dd");

    setInputValue(displayValue);
    onChange(filterValue);
    setCalendarOpen(false);
  };

  const clearDate = () => {
    setInputValue("");
    onChange("");
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative min-w-0 flex-1">
        <input
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          maxLength={10}
          disabled={disabled}
          className="
            h-11
            w-full
            rounded-xl
            border
            border-slate-200
            bg-white
            px-3.5
            pr-10
            text-sm
            font-medium
            text-slate-700
            shadow-sm
            outline-none
            transition-all
            duration-200
            placeholder:text-slate-400
            hover:border-slate-300
            hover:shadow-md
            focus:border-blue-500
            focus:ring-2
            focus:ring-blue-100
            disabled:cursor-not-allowed
            disabled:bg-slate-50
            disabled:opacity-60
          "
        />

        {inputValue && !disabled && (
          <button
            type="button"
            onClick={clearDate}
            aria-label="Limpar data"
            className="
              absolute
              right-3
              top-1/2
              -translate-y-1/2
              text-slate-300
              transition-colors
              hover:text-slate-500
            "
          >
            <X size={15} />
          </button>
        )}
      </div>

      <Popover
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled}
            className="
              h-11
              w-11
              shrink-0
              rounded-xl
              border-slate-200
              bg-white
              text-slate-500
              shadow-sm
              transition-all
              duration-200
              hover:border-slate-300
              hover:bg-slate-50
              hover:text-slate-700
              hover:shadow-md
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
            "
          >
            <CalendarDays size={18} />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          className="
            w-auto
            p-3
            bg-white
            !border-slate-200
            border
            rounded-2xl
            shadow-lg
            outline-none
            ring-0
          "
        >
          <Calendar
            mode="single"
            locale={ptBR}
            selected={selectedDate}
            onSelect={handleCalendarSelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}