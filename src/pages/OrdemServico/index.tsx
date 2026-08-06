import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FileText, ListChecks, ClipboardX } from "lucide-react";

import type { OrdemServico } from "@/modules/ordemServico/ordemServicoType";
import {
  getOrdemServicoById,
  getMachineById,
  listarTecnicos,
} from "@/modules/ordemServico/ordemServicoService";

import { getUser } from "@/modules/login/loginStorage";
import type { UserRole } from "@/modules/login/loginType";

import { OSHeader } from "./../../modules/ordemServico/ordemServicoDetails/OSHeader";
import { OSSummaryCards } from "../../modules/ordemServico/ordemServicoDetails/OSSummaryCards";
import { OSActions } from "../../modules/ordemServico/ordemServicoDetails/OSActions";
import { OSPhotosGallery } from "../../modules/ordemServico/ordemServicoDetails/OSPhotosGallery";
import { formatDateTime, getStatusStyle } from "../../modules/ordemServico/ordemServicoDetails/osDetailsHelpers";

type Tecnico = { id: number; nome: string };

function DetailsSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 space-y-4 animate-pulse">
      <div className="h-72 bg-white rounded-2xl border border-slate-200" />
      <div className="h-40 bg-white rounded-2xl border border-slate-200" />
    </div>
  );
}

export default function OrdemServicoDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [os, setOs] = useState<OrdemServico | null>(null);
  const [maquinaNome, setMaquinaNome] = useState<string | undefined>();
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  const usuario = getUser();
  const userRole: UserRole = usuario?.role ?? "OPERADOR";
  const userId = usuario?.id ?? 0;

  const carregar = useCallback(async () => {
    if (!id || Number.isNaN(Number(id))) return;

    setLoading(true);
    setErro(false);

    try {
      const osData = await getOrdemServicoById(Number(id));
      setOs(osData);

      const [maquina, listaTecnicos] = await Promise.allSettled([
        osData?.maquina_id ? getMachineById(osData.maquina_id) : Promise.resolve(null),
        listarTecnicos(),
      ]);

      if (maquina.status === "fulfilled" && maquina.value) {
        setMaquinaNome(maquina.value.nome ?? undefined);
      }

      if (listaTecnicos.status === "fulfilled") {
        setTecnicos(listaTecnicos.value ?? []);
      }
    } catch (error) {
      console.error("Erro ao carregar ordem de serviço:", error);
      setErro(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function handleRefresh(nextStatus?: string) {
    if (nextStatus) {
      setOs((atual) => (atual ? { ...atual, status: nextStatus } : atual));
    }
    carregar();
  }

  if (loading) return <DetailsSkeleton />;

  if (erro || !os) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center gap-3 text-center max-w-sm">
          <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
            <ClipboardX size={22} />
          </div>
          <p className="font-medium text-slate-700">Ordem de serviço não encontrada</p>
          <p className="text-sm text-slate-400">
            Ela pode ter sido removida ou o link está incorreto.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const tecnicoAtual = tecnicos.find((t) => t.id === os.id_tecnico);
  const statusUpper = String(os.status ?? "").toUpperCase();
  const statusStyle = getStatusStyle(os.status);

 return (
<div className="
  min-h-screen
  bg-gradient-to-br
  from-slate-50
  via-blue-50/40
  to-indigo-50/40
  pt-0
  px-2 sm:px-3 md:px-4
  pb-6
">
    <div
      className="
        max-w-7xl mx-auto
        rounded-3xl
        border border-slate-200/70
        bg-white/95
        backdrop-blur-sm
        overflow-hidden
        shadow-[0_20px_60px_rgba(15,23,42,0.08)]
      "
    >
      <OSHeader
        os={os}
        maquinaNome={maquinaNome}
        onBack={() => navigate(-1)}
      />

      <div className="border-t border-slate-100">
        <OSSummaryCards
          os={os}
          tecnicoNome={tecnicoAtual?.nome}
        />
      </div>

      <div
        className={`
          border-t border-slate-100
          bg-gradient-to-r
          from-blue-50/50
          via-white
          to-indigo-50/40
          ${statusStyle.tint}
        `}
      >
        <OSActions
          os={os}
          userRole={userRole}
          userId={userId}
          tecnicos={tecnicos}
          onRefresh={handleRefresh}
        />
      </div>

      {/* DESCRIÇÃO + RESOLUÇÃO */}
      <div className="grid grid-cols-1 xl:grid-cols-2 border-t border-slate-100 items-stretch">
        <div className="p-5 sm:p-6 bg-gradient-to-br from-blue-50/60 to-transparent">
          <div className="flex items-start gap-3 mb-4">
            <div className="h-10 w-10 rounded-2xl bg-blue-100 flex items-center justify-center shadow-sm">
              <FileText size={18} className="text-blue-600" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-800">
                Descrição da Solicitação
              </h2>
              <p className="text-xs text-slate-500">
                Informações registradas pelo operador
              </p>
            </div>
          </div>

          <p className="text-sm leading-7 text-slate-700 whitespace-pre-wrap">
            {os.descricao || "Nenhuma descrição informada."}
          </p>
        </div>

        <div className="border-t xl:border-t-0 xl:border-l border-slate-100 p-5 sm:p-6 bg-gradient-to-br from-emerald-50/50 to-transparent">
          <div className="flex items-start gap-3 mb-4">
            <div className="h-10 w-10 rounded-2xl bg-emerald-100 flex items-center justify-center shadow-sm">
              <ListChecks size={18} className="text-emerald-600" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-800">
                Resolução Aplicada
              </h2>
              <p className="text-xs text-slate-500">
                Informações registradas pelo técnico
              </p>
            </div>
          </div>

          <p className="text-sm leading-7 text-slate-700 whitespace-pre-wrap">
            {os.resolucao || "Ainda não finalizada."}
          </p>

          {os.data_resolucao && (
            <div className="mt-4 inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
              Finalizada em {formatDateTime(os.data_resolucao)}
            </div>
          )}
        </div>
      </div>

      {/* CANCELAMENTO */}
      {statusUpper === "CANCELADA" && os.motivo_cancelamento && (
        <div className="border-t border-slate-100 p-5 sm:p-6 bg-gradient-to-r from-red-50/50 to-transparent">
          <div className="flex items-start gap-3 mb-4">
            <div className="h-10 w-10 rounded-2xl bg-red-100 flex items-center justify-center shadow-sm">
              <FileText size={18} className="text-red-600" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-800">
                Motivo do Cancelamento
              </h2>
              <p className="text-xs text-slate-500">
                Justificativa registrada pelo gestor
              </p>
            </div>
          </div>

          <p className="text-sm leading-7 text-slate-700 whitespace-pre-wrap">
            {os.motivo_cancelamento}
          </p>

          {os.data_cancelamento && (
            <div className="mt-4 inline-flex items-center px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
              Cancelada em {formatDateTime(os.data_cancelamento)}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-slate-100 bg-slate-50/50">
        <OSPhotosGallery osId={os.id} />
      </div>
    </div>
  </div>
);
}
