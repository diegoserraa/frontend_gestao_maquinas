import { useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useMonitoramentoDados } from "@/modules/monitoramento/useMonitoramentoDados";
import { VitrineMaquina } from "@/modules/monitoramento/VitrineMaquina";

export default function Vitrine() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { leituras, historico, carregando } = useMonitoramentoDados();

  const leitura = leituras.find((l) => String(l.maquina_id) === id);

  // entra em tela cheia de verdade ao abrir — "modo vitrine" é pra isso,
  // chamar a atenção sozinho num estande, não dividir espaço com menu/cabeçalho
  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {
      /* sem suporte/permissão — a tela ainda ocupa a viewport toda sozinha */
    });
    return () => {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, []);

  const sair = useCallback(() => {
    navigate("/monitoring");
  }, [navigate]);

  // Esc nativo do navegador também sai da tela cheia — acompanha e volta pro monitoramento
  useEffect(() => {
    function aoMudar() {
      if (!document.fullscreenElement) sair();
    }
    document.addEventListener("fullscreenchange", aoMudar);
    return () => document.removeEventListener("fullscreenchange", aoMudar);
  }, [sair]);

  if (carregando) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  if (!leitura) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-slate-300">
        <p>Máquina não encontrada ou sem telemetria.</p>
        <button
          type="button"
          onClick={sair}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:border-white/20"
        >
          Voltar ao monitoramento
        </button>
      </div>
    );
  }

  return (
    <VitrineMaquina
      leitura={leitura}
      historico={historico[leitura.maquina_id] ?? []}
      onSair={sair}
    />
  );
}
