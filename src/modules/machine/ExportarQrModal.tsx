import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Download, Loader2, QrCode } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { notify } from "@/lib/notify";

import { calcularGrade, ETIQUETA_PADRAO, nomeDoArquivo, totalDeFolhas } from "./etiquetasLogica";
import { baixarArquivo, gerarPdfEtiquetas } from "./etiquetasPdf";
import { buscarEtiquetas } from "./machineService";
import type { EtiquetasResposta, Machine, Setor } from "./machineTypes";

type Props = {
  open: boolean;
  onClose: () => void;
  setores: Setor[];
  /** todas as máquinas carregadas na tela (para contar quantas etiquetas saem) */
  maquinas: Machine[];
  /** definida = etiqueta de uma máquina só; vazia = exportar várias */
  maquina?: Machine | null;
};

/** O Select (Radix) não aceita valor vazio: este marca "todas as máquinas". */
const TODAS = "__todas__";

const GRADE = calcularGrade();
const { largura: LARGURA, altura: ALTURA } = ETIQUETA_PADRAO;

function AvisoDeEnderecoDeTeste({ endereco }: { endereco: string }) {
  return (
    <div role="alert" className="flex gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 sm:text-sm">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold">O endereço do sistema é de teste</p>
        <p className="mt-0.5">
          Os QR Codes apontam para <strong className="break-all">{endereco}</strong>, que só funciona aqui neste computador. <strong>Não cole estas etiquetas nas máquinas.</strong> Configure o endereço
          definitivo (FRONTEND_URL, com https) no servidor e gere de novo.
        </p>
      </div>
    </div>
  );
}

/**
 * Exportar os QR Codes das máquinas em PDF, prontos para imprimir e colar. O QR é gerado no servidor no
 * momento da exportação, com o endereço atual do sistema. Uma máquina só = etiqueta individual com
 * pré-visualização; várias = folha A4 com linha de corte (todas ou de um setor).
 */
export function ExportarQrModal({ open, onClose, setores, maquinas, maquina = null }: Props) {
  const individual = maquina !== null;

  const [setorId, setSetorId] = useState("");
  const [dados, setDados] = useState<EtiquetasResposta | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  /** no modo "vários": o servidor avisou que o endereço é de teste e a pessoa ainda não confirmou */
  const [confirmandoTeste, setConfirmandoTeste] = useState(false);

  useEffect(() => {
    if (!open) return;

    setSetorId("");
    setDados(null);
    setErro(null);
    setConfirmandoTeste(false);
    setOcupado(false);

    // individual: já carrega para mostrar a pré-visualização (e o aviso, se houver)
    if (maquina) {
      let ativo = true;
      setOcupado(true);

      buscarEtiquetas({ ids: [maquina.id] })
        .then((r) => ativo && setDados(r))
        .catch((e) => ativo && setErro(e instanceof Error ? e.message : "Não foi possível carregar a etiqueta."))
        .finally(() => ativo && setOcupado(false));

      return () => {
        ativo = false;
      };
    }
  }, [open, maquina]);

  const doSetor = useMemo(() => maquinas.filter((m) => setorId === "" || String(m.setor_id) === setorId), [maquinas, setorId]);
  const nomeDoSetor = setores.find((s) => String(s.id) === setorId)?.nome ?? null;
  const folhas = totalDeFolhas(doSetor.length, GRADE);

  async function gerar(recebidos: EtiquetasResposta) {
    setOcupado(true);
    setErro(null);

    try {
      const pdf = await gerarPdfEtiquetas(recebidos, individual ? "individual" : "folha");
      baixarArquivo(pdf, nomeDoArquivo(recebidos.itens, nomeDoSetor));

      notify.success(recebidos.itens.length === 1 ? "Etiqueta gerada" : `${recebidos.itens.length} etiquetas geradas`);
      onClose();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível gerar o PDF.");
    } finally {
      setOcupado(false);
    }
  }

  async function exportar() {
    try {
      setOcupado(true);
      setErro(null);

      const recebidos = dados ?? (await buscarEtiquetas(setorId ? { setorId: Number(setorId) } : {}));

      if (recebidos.itens.length === 0) {
        setErro("Nenhuma máquina para exportar.");
        return;
      }

      // vários + endereço de teste: pede confirmação antes de gerar
      if (!individual && recebidos.endereco_de_teste && !confirmandoTeste) {
        setDados(recebidos);
        setConfirmandoTeste(true);
        return;
      }

      await gerar(recebidos);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível exportar.");
    } finally {
      setOcupado(false);
    }
  }

  const etiqueta = dados?.itens[0];
  const semMaquinas = !individual && doSetor.length === 0;

  return (
    <Dialog open={open} onOpenChange={(aberto) => !aberto && !ocupado && onClose()}>
      <DialogContent className="flex max-h-[92vh] w-[96vw] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-md">
        <DialogHeader className="shrink-0 px-4 pb-4 pt-5 text-left sm:px-6 sm:pt-6">
          <div className="flex items-center gap-3 pr-8">
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm"
            >
              <QrCode size={20} />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-left text-lg font-semibold sm:text-xl">{individual ? "Etiqueta QR Code" : "Exportar QR Codes"}</DialogTitle>
              <DialogDescription className="text-left text-xs text-slate-500 sm:text-sm">
                {individual ? "PDF com a etiqueta desta máquina." : "PDF pronto para imprimir e colar nas máquinas."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto border-t bg-slate-50/60 px-4 py-5 sm:px-6">
          {individual ? (
            <>
              {ocupado && !dados && (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400" aria-busy="true">
                  <Loader2 size={16} className="animate-spin" /> Gerando...
                </div>
              )}

              {etiqueta && dados && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">Pré-visualização</p>
                  <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 p-2.5" style={{ aspectRatio: `${LARGURA} / ${ALTURA}` }}>
                    <img src={etiqueta.qr} alt={`QR Code de ${etiqueta.nome}`} className="h-full max-h-24 aspect-square shrink-0" />
                    <div className="min-w-0">
                      {dados.empresa && <p className="truncate text-[9px] font-medium uppercase text-slate-400">{dados.empresa}</p>}
                      <p className="text-sm font-bold leading-tight text-slate-900 [overflow-wrap:anywhere]">{etiqueta.nome}</p>
                      {etiqueta.setor && <p className="mt-1 truncate text-[11px] text-slate-500">{etiqueta.setor}</p>}
                      <p className="mt-1 text-[9px] text-slate-400">ID {etiqueta.id} · Escaneie para abrir O.S.</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Etiqueta de {LARGURA} × {ALTURA} mm. O PDF sai do tamanho exato da etiqueta.
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <label htmlFor="qr-setor" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                  Quais máquinas
                </label>
                <Select
                  value={setorId || TODAS}
                  onValueChange={(v) => {
                    setSetorId(v === TODAS ? "" : v);
                    setConfirmandoTeste(false);
                    setDados(null);
                    setErro(null);
                  }}
                  disabled={ocupado}
                >
                  <SelectTrigger id="qr-setor">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TODAS}>Todas as máquinas</SelectItem>
                    {setores.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        Setor: {s.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-2xl font-bold text-slate-900">
                  {doSetor.length} <span className="text-sm font-normal text-slate-500">{doSetor.length === 1 ? "etiqueta" : "etiquetas"}</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Etiquetas de {LARGURA} × {ALTURA} mm, {GRADE.porFolha} por folha A4
                  {folhas > 0 && ` (${folhas} ${folhas === 1 ? "folha" : "folhas"})`}, com linha fina para recortar.
                </p>
              </div>
            </>
          )}

          {dados?.endereco_de_teste && (individual || confirmandoTeste) && <AvisoDeEnderecoDeTeste endereco={dados.base_url} />}

          {erro && (
            <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5">
              <span className="size-1.5 shrink-0 rounded-full bg-red-400" />
              <p className="text-xs text-red-600">{erro}</p>
            </div>
          )}

          <p className="text-[11px] text-slate-400">
            Dica: imprima em vinil ou poliéster adesivo; papel comum não dura no chão de fábrica. O QR só funciona depois que o sistema estiver no endereço definitivo.
          </p>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-white px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
          <Button type="button" variant="outline" onClick={onClose} disabled={ocupado} className="h-10 w-full sm:h-9 sm:w-auto">
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={exportar}
            disabled={ocupado || semMaquinas || (individual && !dados)}
            className={`h-10 w-full text-white sm:h-9 sm:w-auto ${
              dados?.endereco_de_teste && (individual || confirmandoTeste) ? "bg-red-600 hover:bg-red-700" : "bg-gradient-to-r from-blue-600 to-indigo-600"
            }`}
          >
            {ocupado ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {dados?.endereco_de_teste && (individual || confirmandoTeste) ? "Baixar mesmo assim" : individual ? "Baixar etiqueta" : "Gerar PDF"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
