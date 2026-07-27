export function formatMaintenanceDate(
  date?: string | null
) {
  if (!date) return "—";

  return new Date(date)
    .toLocaleDateString("pt-BR");
}

export function getMaintenanceDaysRemaining(
  date?: string | null
) {
  if (!date) return null;

  const hoje = new Date();
  const alvo = new Date(date);

  hoje.setHours(0, 0, 0, 0);
  alvo.setHours(0, 0, 0, 0);

  const diff =
    alvo.getTime() - hoje.getTime();

  return Math.ceil(
    diff / (1000 * 60 * 60 * 24)
  );
}

export function getMaintenanceStatus(
  date?: string | null
) {
  const dias =
    getMaintenanceDaysRemaining(date);

  if (dias === null) {
    return {
      label: "Sem data",
      className:
        "bg-slate-100 text-slate-700",
    };
  }

  if (dias < 0) {
    return {
      label: "Atrasada",
      className:
        "bg-red-100 text-red-700",
    };
  }

  if (dias <= 7) {
    return {
      label: "Próxima",
      className:
        "bg-amber-100 text-amber-700",
    };
  }

  return {
    label: "Em dia",
    className:
      "bg-emerald-100 text-emerald-700",
  };
}