import type { TelemetriaAtual } from "./monitoramentoTypes";

/**
 * Motor de dados simulados para o painel de Monitoramento.
 *
 * Usado quando ainda não há telemetria real chegando do broker, só para a
 * tela nascer "viva". Cada tick faz um random walk com reversão à média,
 * mais alguns cenários fixos (crítica, atenção, offline, sem dados).
 */

type Cenario = "normal" | "atencao" | "critico" | "offline" | "sem-dados";

type MockBase = {
  maquina_id: number;
  maquina_nome: string;
  setor_id: number | null;
  setor_nome: string | null;
  cenario?: Cenario;
};

type EstadoMock = {
  temperatura: number;
  vibracao: number;
  horas: number;
  alvoTemp: number;
  alvoVib: number;
  offline: boolean;
  semDados: boolean;
};

const FROTA_PADRAO: MockBase[] = [
  // Usinagem
  { maquina_id: 9001, maquina_nome: "Torno CNC 07", setor_id: 1, setor_nome: "Usinagem" },
  { maquina_id: 9002, maquina_nome: "Centro de Usinagem 02", setor_id: 1, setor_nome: "Usinagem", cenario: "critico" },
  { maquina_id: 9003, maquina_nome: "Fresadora Universal 04", setor_id: 1, setor_nome: "Usinagem" },
  { maquina_id: 9004, maquina_nome: "Retífica Cilíndrica 01", setor_id: 1, setor_nome: "Usinagem" },
  { maquina_id: 9005, maquina_nome: "Torno CNC 11", setor_id: 1, setor_nome: "Usinagem", cenario: "sem-dados" },

  // Estamparia
  { maquina_id: 9006, maquina_nome: "Prensa Hidráulica 02", setor_id: 2, setor_nome: "Estamparia", cenario: "atencao" },
  { maquina_id: 9007, maquina_nome: "Prensa Excêntrica 05", setor_id: 2, setor_nome: "Estamparia" },
  { maquina_id: 9008, maquina_nome: "Prensa Excêntrica 06", setor_id: 2, setor_nome: "Estamparia" },
  { maquina_id: 9009, maquina_nome: "Guilhotina Industrial 03", setor_id: 2, setor_nome: "Estamparia" },

  // Injeção Plástica
  { maquina_id: 9010, maquina_nome: "Injetora 03", setor_id: 3, setor_nome: "Injeção Plástica" },
  { maquina_id: 9011, maquina_nome: "Injetora 08", setor_id: 3, setor_nome: "Injeção Plástica", cenario: "atencao" },
  { maquina_id: 9012, maquina_nome: "Injetora 12", setor_id: 3, setor_nome: "Injeção Plástica" },
  { maquina_id: 9013, maquina_nome: "Moinho Granulador 02", setor_id: 3, setor_nome: "Injeção Plástica", cenario: "offline" },

  // Utilidades
  { maquina_id: 9014, maquina_nome: "Compressor de Ar A1", setor_id: 4, setor_nome: "Utilidades" },
  { maquina_id: 9015, maquina_nome: "Bomba Centrífuga B2", setor_id: 4, setor_nome: "Utilidades" },
  { maquina_id: 9016, maquina_nome: "Exaustor Industrial 04", setor_id: 4, setor_nome: "Utilidades" },
  { maquina_id: 9017, maquina_nome: "Chiller de Processo 01", setor_id: 4, setor_nome: "Utilidades" },
];

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function passo(atual: number, alvo: number, forca: number, ruido: number) {
  const puxao = (alvo - atual) * forca;
  const random = (Math.random() - 0.5) * ruido;
  return atual + puxao + random;
}

export type MotorMock = {
  tick: () => TelemetriaAtual[];
};

export function criarMotorMock(baseReal?: MockBase[]): MotorMock {
  const usaReal = Boolean(baseReal && baseReal.length > 0);
  const base = usaReal ? baseReal! : FROTA_PADRAO;

  const estados = new Map<number, EstadoMock>();

  base.forEach((m, i) => {
    // Com dados reais não temos cenário definido: distribui alguns por índice
    // só para a tela não ficar "toda verde".
    const cenario: Cenario =
      m.cenario ??
      (usaReal
        ? i % 7 === 1
          ? "critico"
          : i % 5 === 2
          ? "atencao"
          : i % 11 === 7
          ? "offline"
          : "normal"
        : "normal");

    const quente = cenario === "critico";
    const morno = cenario === "atencao";

    const alvoTemp = quente
      ? 82 + Math.random() * 10
      : morno
      ? 63 + Math.random() * 9
      : 42 + Math.random() * 12;

    const alvoVib = quente
      ? 7.2 + Math.random() * 1.6
      : morno
      ? 4.6 + Math.random() * 1.2
      : 1.4 + Math.random() * 1.8;

    estados.set(m.maquina_id, {
      temperatura: alvoTemp + (Math.random() - 0.5) * 5,
      vibracao: Math.max(alvoVib + (Math.random() - 0.5) * 0.8, 0.3),
      horas: 200 + Math.random() * 6000,
      alvoTemp,
      alvoVib,
      offline: cenario === "offline",
      semDados: cenario === "sem-dados",
    });
  });

  function tick(): TelemetriaAtual[] {
    const agora = Date.now();

    return base.map((m) => {
      const s = estados.get(m.maquina_id)!;

      if (s.semDados) {
        return {
          ...m,
          status: "ativa",
          temperatura: null,
          vibracao: null,
          horas_ligadas: null,
          atualizado_em: null,
        };
      }

      // random walk suave, com reversão à média (tela calma de ler)
      s.temperatura = clamp(passo(s.temperatura, s.alvoTemp, 0.05, 0.6), 18, 115);
      s.vibracao = clamp(passo(s.vibracao, s.alvoVib, 0.05, 0.18), 0.1, 13);
      s.horas += 4 / 3600;

      if (Math.random() < 0.012) {
        s.alvoTemp = clamp(s.alvoTemp + (Math.random() - 0.5) * 10, 35, 98);
      }
      if (Math.random() < 0.012) {
        s.alvoVib = clamp(s.alvoVib + (Math.random() - 0.5) * 1.6, 0.8, 9.5);
      }

      const atualizadoEm = s.offline
        ? new Date(agora - 7 * 60 * 1000).toISOString()
        : new Date(agora).toISOString();

      return {
        ...m,
        status: "ativa",
        temperatura: Number(s.temperatura.toFixed(1)),
        vibracao: Number(s.vibracao.toFixed(2)),
        horas_ligadas: Number(s.horas.toFixed(1)),
        atualizado_em: atualizadoEm,
      };
    });
  }

  return { tick };
}
