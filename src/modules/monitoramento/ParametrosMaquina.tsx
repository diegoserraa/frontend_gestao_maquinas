import { useEffect, useRef, useState } from "react";
import { Loader2, Save, Thermometer, Activity } from "lucide-react";

import { notify } from "@/lib/notify";
import {
  getParametros,
  salvarParametros,
  type MaquinaParametro,
} from "./monitoramentoService";

type Props = { maquinaId?: number };

const ROTULO: Record<string, string> = {
  temperatura: "Temperatura",
  vibracao: "Vibração",
  horas_ligadas: "Horas ligadas",
};
const ICONE: Record<string, typeof Thermometer> = {
  temperatura: Thermometer,
  vibracao: Activity,
};

function num(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function ParametrosMaquina({ maquinaId }: Props) {
  const [lista, setLista] = useState<MaquinaParametro[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const vivo = useRef(true);

  useEffect(() => {
    vivo.current = true;
    if (!maquinaId) return;
    setCarregando(true);
    getParametros(maquinaId)
      .then((l) => vivo.current && setLista(l))
      .catch(() => vivo.current && notify.error("Erro ao carregar parâmetros"))
      .finally(() => vivo.current && setCarregando(false));
    return () => {
      vivo.current = false;
    };
  }, [maquinaId]);

  function set(i: number, patch: Partial<MaquinaParametro>) {
    setLista((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  async function handleSalvar() {
    if (!maquinaId) return;
    try {
      setSalvando(true);
      const salvos = await salvarParametros(maquinaId, lista);
      setLista(salvos);
      notify.success("Parâmetros salvos");
    } catch {
      notify.error("Erro ao salvar parâmetros");
    } finally {
      setSalvando(false);
    }
  }

  if (!maquinaId) {
    return (
      <p className="py-10 text-center text-sm text-slate-500">
        Salve a máquina primeiro para configurar os parâmetros de monitoramento.
      </p>
    );
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Faixas de alerta usadas pela rotina 24/7. Vazio = usa o padrão. A O.S.
        não abre sozinha (a não ser que "Abrir O.S. automática" esteja marcado);
        o alerta aparece no Monitoramento com o botão de abrir.
      </p>

      <div className="space-y-3">
        {lista.map((p, i) => {
          const Icone = ICONE[p.chave] ?? Activity;
          return (
            <div
              key={p.chave}
              className="rounded-xl border border-slate-200 bg-white p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-800">
                  <Icone size={14} className="text-blue-500" />
                  {ROTULO[p.chave] ?? p.chave}
                  <span className="text-xs font-normal text-slate-400">
                    {p.unidade}
                  </span>
                </span>
                <label className="flex items-center gap-1.5 text-xs text-slate-500">
                  <input
                    type="checkbox"
                    checked={p.ativo}
                    onChange={(e) => set(i, { ativo: e.target.checked })}
                  />
                  Ativo
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Campo
                  label="Mínimo (opc.)"
                  value={p.minimo}
                  onChange={(v) => set(i, { minimo: num(v) })}
                />
                <Campo
                  label="Atenção"
                  value={p.atencao}
                  onChange={(v) => set(i, { atencao: num(v) })}
                />
                <Campo
                  label="Alarme"
                  value={p.alarme}
                  onChange={(v) => set(i, { alarme: num(v) })}
                />
                <Campo
                  label="Janela (min)"
                  value={p.janela_seg / 60}
                  onChange={(v) =>
                    set(i, { janela_seg: Math.max(1, Math.round((num(v) ?? 2) * 60)) })
                  }
                />
              </div>

              <label className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={p.abrir_os_auto}
                  onChange={(e) => set(i, { abrir_os_auto: e.target.checked })}
                />
                Abrir O.S. automaticamente quando confirmar o alerta
              </label>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSalvar}
          disabled={salvando}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {salvando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Salvar parâmetros
        </button>
      </div>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-slate-500">{label}</span>
      <input
        inputMode="decimal"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg border border-slate-200 px-2 text-sm text-slate-700 outline-none focus:border-blue-400"
      />
    </label>
  );
}
