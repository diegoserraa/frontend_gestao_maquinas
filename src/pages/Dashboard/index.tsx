import { Card, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">
          Dashboard
        </h1>
        <p className="text-sm text-slate-500">
          Visão geral do seu sistema
        </p>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Máquinas ativas</p>
            <h2 className="text-2xl font-bold text-slate-800">
              12
            </h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Clientes</p>
            <h2 className="text-2xl font-bold text-slate-800">
              48
            </h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Chamados abertos</p>
            <h2 className="text-2xl font-bold text-slate-800">
              3
            </h2>
          </CardContent>
        </Card>
      </div>

      {/* AREA PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LISTA */}
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Últimas máquinas</h3>

          <div className="space-y-3">
            {["Máquina 01", "Máquina 02", "Máquina 03"].map(
              (item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 rounded-lg hover:bg-slate-50"
                >
                  <span>{item}</span>
                  <span className="text-xs text-green-600">
                    Online
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        {/* ATIVIDADES */}
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Atividades recentes</h3>

          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              ✔ Máquina 01 conectada
            </p>
            <p className="text-sm text-slate-600">
              ✔ Cliente novo cadastrado
            </p>
            <p className="text-sm text-slate-600">
              ✔ Manutenção concluída
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}