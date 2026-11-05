import { useEffect, useState } from "react";
import { Loader2, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { notify } from "@/lib/notify";

import { criarVinculoExterno, getSectors } from "./machineService";
import type { Machine, Setor } from "./machineTypes";

type Props = {
  open: boolean;
  onClose: () => void;
  onCriado: (maquina: Machine) => void;
};

/**
 * "Vincular máquina do cliente" — cadastro enxuto pro cenário "a empresa já
 * gerencia o próprio parque em outro sistema (ERP/CMMS/planilha) e só quer
 * o sensor plugado aqui". Sem modelo/fabricante/plano de manutenção: só o
 * suficiente pra existir uma máquina e colar telemetria nela. A referência
 * é só uma anotação livre — nada sincroniza com o sistema do cliente ainda.
 */
export function VinculoExternoModal({ open, onClose, onCriado }: Props) {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [nome, setNome] = useState("");
  const [setorId, setSetorId] = useState("");
  const [referenciaExterna, setReferenciaExterna] = useState("");
  const [sistemaOrigem, setSistemaOrigem] = useState("");
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNome("");
    setSetorId("");
    setReferenciaExterna("");
    setSistemaOrigem("");
    setObservacao("");
    getSectors()
      .then(setSetores)
      .catch(() => notify.error("Erro ao carregar setores"));
  }, [open]);

  async function salvar() {
    if (!nome.trim()) return notify.error("Dê um nome pra essa máquina");
    if (!setorId) return notify.error("Escolha o setor");

    setSalvando(true);
    try {
      const maquina = await criarVinculoExterno({
        nome: nome.trim(),
        setor_id: Number(setorId),
        referencia_externa: referenciaExterna.trim() || undefined,
        sistema_origem: sistemaOrigem.trim() || undefined,
        observacao: observacao.trim() || undefined,
      });
      notify.success(`"${maquina.nome}" vinculada — já está ativa no Monitoramento`);
      onCriado(maquina);
      onClose();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Erro ao vincular máquina");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(aberto) => !aberto && onClose()}>
      <DialogContent className="w-[96vw] rounded-2xl sm:max-w-md">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-3 pr-8">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Building2 size={20} />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-left text-lg font-semibold">Vincular máquina do cliente</DialogTitle>
              <DialogDescription className="text-left text-xs text-slate-500 sm:text-sm">
                Cadastro enxuto, só pra monitorar
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Nome da máquina *</label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Prensa 03" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Setor *</label>
            <Select value={setorId} onValueChange={setSetorId}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Escolha o setor" />
              </SelectTrigger>
              <SelectContent>
                {setores.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Referência externa</label>
              <Input
                value={referenciaExterna}
                onChange={(e) => setReferenciaExterna(e.target.value)}
                placeholder="Código no sistema dele"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Sistema de origem</label>
              <Input value={sistemaOrigem} onChange={(e) => setSistemaOrigem(e.target.value)} placeholder="Ex.: SAP" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Observação (opcional)</label>
            <Input value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Qualquer nota útil" />
          </div>

          <p className="text-[11px] text-slate-400">
            Referência, sistema e observação são só uma anotação livre — nada disso sincroniza
            automaticamente com o sistema do cliente.
          </p>
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 border-t pt-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} className="h-10 w-full sm:h-9 sm:w-auto">
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="h-10 w-full gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white sm:h-9 sm:w-auto"
          >
            {salvando ? <Loader2 size={14} className="animate-spin" /> : null}
            Vincular e ativar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
