
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Inbox,
  ClipboardList,
  Clock,
  CheckCircle2,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PwaScanner from "@/components/pwa/PwaScanner";

import { useDashboardTecnico } from "../../hooks/useDashboardTecnico";

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

export function DashboardTecnico() {
  const navigate = useNavigate();
  const [scannerAberto, setScannerAberto] = useState(false);

  const usuario = getUser();

  if (!usuario?.id) {
    return null;
  }

  const {
    loading,
    erro,
    resumo,
    minhasOs,
    refetch,
  } = useDashboardTecnico(usuario.id);

  if (erro) {
    return <DashboardErrorState onRetry={refetch} />;
  }

  if (loading || !resumo) {
    return <DashboardSkeleton />;
  }

  const handleVisualizar = (ordem: OrdemServicoResumo) => {
    navigate(`/ordens-servico/${ordem.id}`);
  };

  return (
    <div className="space-y-4 overflow-x-hidden md:space-y-6">
        {/* SCANNER PWA */}
    {scannerAberto && (
      <PwaScanner
        onClose={() => setScannerAberto(false)}
        onScan={(value) => {
          setScannerAberto(false);

          if (
            value.startsWith("http://") ||
            value.startsWith("https://")
          ) {
            window.location.href = value;
            return;
          }

          navigate(`/machines/${value}`);
        }}
      />
    )}

    {/* BOTÃO SCANNER MOBILE */}
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
        <h1 className="text-xl font-semibold text-slate-800 md:text-2xl">
          Dashboard do Técnico
        </h1>

        <p className="text-xs text-slate-500 md:text-sm">
          Visão geral das suas ordens de serviço
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

        <DashboardKpiCard
          label="Total OS"
          value={formatCompactNumber(resumo.total)}
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

      {/* MINHAS ORDENS */}
      <DashboardSection
        title="Minhas Ordens de Serviço"
        subtitle={`${minhasOs.length} ordem(ns) no total`}
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

export default DashboardTecnico;

