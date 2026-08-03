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

import { OrdemServicoTimeline } from "@/modules/ordemServico/ordemDeServicoTimeline";

import { OSHeader } from "./../../modules/ordemServico/ordemServicoDetails/OSHeader";
import { OSSummaryCards } from "../../modules/ordemServico/ordemServicoDetails/OSSummaryCards";
import { OSActions } from "../../modules/ordemServico/ordemServicoDetails/OSActions";
import { OSPhotosGallery } from "../../modules/ordemServico/ordemServicoDetails/OSPhotosGallery";
import { formatDateTime, getStatusStyle } from "../../modules/ordemServico/ordemServicoDetails/osDetailsHelpers";

type Tecnico = { id: number; nome: string };

function DetailsSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 space-y-4 animate-pulse">
      <div className="h-52 bg-white rounded-2xl border border-slate-200" />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="h-40 bg-white rounded-2xl border border-slate-200" />
        <div className="xl:col-span-2 h-64 bg-white rounded-2xl border border-slate-200" />
      </div>
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

      // busca nome da máquina e lista de técnicos em paralelo — nenhum
      // dos dois é crítico o suficiente pra travar a tela se falhar
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
    // atualiza o status na hora (feedback imediato), e busca os dados
    // completos e corretos do servidor logo em seguida
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
  <div className="min-h-screen bg-slate-50 p-3 sm:p-4 md:p-6 space-y-4">
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
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

      <div className={`border-t border-slate-100 ${statusStyle.tint}`}>
        <OSActions
          os={os}
          userRole={userRole}
          userId={userId}
          tecnicos={tecnicos}
          onRefresh={handleRefresh}
        />
      </div>
    </div>

    {/* DESCRIÇÃO + RESOLUÇÃO */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      <div className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-blue-400 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={16} className="text-blue-500" />
          <h2 className="font-semibold text-slate-800 text-sm">
            Descrição da solicitação
          </h2>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
          {os.descricao || "Nenhuma descrição informada."}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-emerald-500 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <ListChecks size={16} className="text-emerald-500" />
          <h2 className="font-semibold text-slate-800 text-sm">
            Resolução aplicada
          </h2>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
          {os.resolucao || "Ainda não finalizada."}
        </p>

        {os.data_resolucao && (
          <p className="text-xs text-slate-400 mt-3">
            Finalizada em {formatDateTime(os.data_resolucao)}
          </p>
        )}
      </div>

    </div>

    {statusUpper === "CANCELADA" &&
      os.motivo_cancelamento && (
        <div className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-red-400 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-red-500" />
            <h2 className="font-semibold text-slate-800 text-sm">
              Motivo do cancelamento
            </h2>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
            {os.motivo_cancelamento}
          </p>

          {os.data_cancelamento && (
            <p className="text-xs text-slate-400 mt-3">
              Cancelada em {formatDateTime(os.data_cancelamento)}
            </p>
          )}
        </div>
      )}

    {/* FOTOS */}
    <OSPhotosGallery osId={os.id} />

    {/* TIMELINE */}
    <OrdemServicoTimeline os={os} />
  </div>
);
}
