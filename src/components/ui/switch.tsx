import { cn } from "@/lib/utils";

type Props = {
  checked: boolean;
  onCheckedChange: (valor: boolean) => void;
  /** texto lido por leitores de tela (o rótulo visível fica ao lado) */
  label: string;
  id?: string;
  disabled?: boolean;
  className?: string;
};

/** Interruptor acessível (role="switch"): teclado (espaço/enter), foco visível e alvo de toque confortável. */
export function Switch({ checked, onCheckedChange, label, id, disabled, className }: Props) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent transition-colors",
        // amplia a área de toque (o desenho continua pequeno): ~44px de altura pro dedo
        "before:absolute before:-inset-2.5 before:content-['']",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        checked ? "bg-blue-600" : "bg-slate-300",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-block size-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
