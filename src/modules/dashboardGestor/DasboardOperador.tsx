import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox, Clock, CheckCircle2, QrCode, ClipboardList } from "lucide-react";

import { useDashboardOperador } from "../../hooks/useDashboardOperador";
import { DashboardKpiCard } from "../../modules/dashboardGestor/DashboardKpiCard";
import { DashboardSection } from "../../modules/dashboardGestor/DashboardSection";
import { SolicitacoesFiltradas } from "../../modules/dashboardGestor/SolicitacoesFiltradas";
import type { OrdemServicoResumo } from "../../modules/dashboardGestor/OrdemServicoCard";

import {
  DashboardSkeleton,
  DashboardErrorState,
  formatCompactNumber,
} from "../dashboardGestor/DashboardGestorParts";
import { getUser } from "@/modules/login/loginStorage";
import { Button } from "@/components/ui/button";
import PwaScanner from "@/components/pwa/PwaScanner";

export function DashboardOperador() {
  const navigate = useNavigate();
  const [scannerAberto, setScannerAberto] = useState(false);

  const usuario = getUser();

  if (!usuario?.id) {
    return null;
  }

  const { loading, erro, resumo, minhasOs, refetch } = useDashboardOperador(usuario.id);

  if (erro) return <DashboardErrorState onRetry={refetch} />;
  if (loading || !resumo) return <DashboardSkeleton />;

  const total = resumo.abertas + resumo.andamento + resumo.finalizadas;

  const handleVisualizar = (ordem: OrdemServicoResumo) => {
    navigate(`/ordens-servico/${ordem.id}`);
  };

  return (
    <div className="space-y-4 md:space-y-6 overflow-x-hidden">
      {/* SCANNER PWA */}
      {scannerAberto && (
        <PwaScanner
          onClose={() => setScannerAberto(false)}
          onScan={(value) => {
            setScannerAberto(false);

            if (value.startsWith("http://") || value.startsWith("https://")) {
              window.location.href = value;
              return;
            }

            navigate(`/machines/${value}`);
          }}
        />
      )}

      {/* SCANNER QR — apenas em telas pequenas */}
      <div className="w-full md:hidden">
        <Button
          onClick={() => setScannerAberto(true)}
          className="
            w-full h-12 rounded-xl gap-3
            bg-emerald-600 hover:bg-emerald-700
            text-white font-semibold shadow-sm
            transition-all hover:shadow-md
          "
        >
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/15">
            <QrCode size={20} />
          </div>
          <span>Escanear Máquina</span>
        </Button>
      </div>

      {/* HEADER */}
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-800">Dashboard do Operador</h1>
        <p className="text-xs md:text-sm text-slate-500">Visão geral das suas solicitações</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <DashboardKpiCard
          label="Total OS"
          value={formatCompactNumber(total)}
          icon={<ClipboardList size={20} />}
          colorClass="bg-slate-100 text-slate-600"
        />
        <DashboardKpiCard
          label="Abertas"
          value={formatCompactNumber(resumo.abertas)}
          icon={<Inbox size={20} />}
          colorClass="bg-blue-50 text-blue-600"
        />
        <DashboardKpiCard
          label="Em Andamento"
          value={formatCompactNumber(resumo.andamento)}
          icon={<Clock size={20} />}
          colorClass="bg-amber-50 text-amber-600"
        />
        <DashboardKpiCard
          label="Finalizadas"
          value={formatCompactNumber(resumo.finalizadas)}
          icon={<CheckCircle2 size={20} />}
          colorClass="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* MINHAS SOLICITAÇÕES */}
      <DashboardSection
        title="Minhas Solicitações"
        subtitle={`${minhasOs.length} solicitação(ões) no total`}
        className="border-t-4 border-t-blue-400"
      >
        <SolicitacoesFiltradas
          ordens={minhasOs}
          onVisualizar={handleVisualizar}
          itensIniciais={4}
          itensPorCarregamento={4}
        />
      </DashboardSection>
    </div>
  );
}

export default DashboardOperador;
