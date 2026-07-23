import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import { DataTable } from "@/components/data/DataTable";
import { DataCards } from "@/components/data/DataCard";
import { Pagination } from "@/components/data/Pagination";
import { DataTableLoading } from "@/components/data/DataTableLoading";
import { notify } from "@/lib/notify";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

import { MachineDetailsHeader } from "../../modules/machineDetails/machineDetailsHeader";
import { MachineDetailsFilters } from "../../modules/machineDetails/machineDetailsFilters";
import { MachineDetailsActions } from "../../modules/machineDetails/machineDetailsAction";
import { listarTecnicos } from "../../modules/ordemServico/ordemServicoService"; // 👈 IMPORTADO
import { getUser } from "@/modules/login/loginStorage";
import type { UserRole } from "@/modules/login/loginType";
import {
  getMachineById,
  getOrdensByMachineId,
  createOrdemServico, // 👈 ADICIONADO
} from "../../modules/ordemServico/ordemServicoService";

import type {
  Machine,
  OrdemServico,
  OrdemServicoFormData,
} from "../../modules/machineDetails/machineDetailsTypes";

import { getMachineDetailsColumns } from "../../modules/machineDetails/machineDetailsMantenanceTable";
import { getMachineDetailsMobileColumns } from "../../modules/machineDetails/machineDetailsMantenanceCard";

import { useSectors } from "@/hooks/useSector";
import { OrdemServicoTimeline } from "../../modules/ordemServico/ordemDeServicoTimeline";
import { OrdemServicoModal } from "../../components/modals/ordemServico/CriarOrdemServico"; // 👈 ADICIONADO

/* ------------------------------------------------------------------ */
/* SKELETONS — mesmo padrão visual do restante da tela (rounded-2xl,   */
/* border-slate-200, bg-white, shadow-sm) para não quebrar a           */
/* consistência quando os dados ainda estão carregando.                */
/* ------------------------------------------------------------------ */

function HeaderSkeleton() {
  return (
    <div className="w-full h-full bg-white rounded-2xl border border-slate-200 shadow-sm p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 bg-slate-200 rounded" />
          <div className="h-3 w-1/4 bg-slate-100 rounded" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-2/3 bg-slate-100 rounded" />
            <div className="h-4 w-1/2 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionsSkeleton() {
  return (
    <div className="w-full h-full bg-white rounded-2xl border border-slate-200 shadow-sm p-4 animate-pulse flex flex-col justify-center gap-3">
      <div className="h-3 w-1/4 bg-slate-100 rounded" />
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="h-10 w-full sm:w-40 bg-slate-200 rounded-lg" />
        <div className="h-10 w-full sm:w-40 bg-slate-200 rounded-lg" />
      </div>
    </div>
  );
}

function FiltersSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-3 animate-pulse">
      <div className="h-9 w-full sm:w-64 bg-slate-100 rounded-lg" />
      <div className="h-9 w-full sm:w-40 bg-slate-100 rounded-lg" />
      <div className="h-9 w-full sm:w-40 bg-slate-100 rounded-lg" />
    </div>
  );
}

export default function MachineDetails() {
  const { id } = useParams<{ id: string }>();
  const machineId = Number(id);

  const { sectors } = useSectors();

  const [machine, setMachine] = useState<Machine | null>(null);
  const [osList, setOsList] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedOS, setSelectedOS] =
    useState<OrdemServico | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [isMobile, setIsMobile] = useState(false);
  const [tecnicos, setTecnicos] = useState<
    { id: number; nome: string }[]
  >([]);
  const [tecnicosLoading, setTecnicosLoading] = useState(true);

  // 👇 MODAL CREATE OS
  const [openCreateOS, setOpenCreateOS] = useState(false);
  const user = getUser();

  const userRole: UserRole =
    user?.role ?? "OPERADOR";

  const userId =
    user?.id ?? 0;

  useEffect(() => {
    async function carregarTecnicos() {
      try {
        setTecnicosLoading(true);
        const data = await listarTecnicos();
        setTecnicos(data ?? []);
      } catch (error) {
        console.error(error);
      } finally {
        setTecnicosLoading(false);
      }
    }

    carregarTecnicos();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1280);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () =>
      window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!machineId || Number.isNaN(machineId)) return;

    async function load() {
      setLoading(true);

      try {
        const [m, os] = await Promise.all([
          getMachineById(machineId),
          getOrdensByMachineId(machineId),
        ]);

        setMachine(m);
        setOsList(os ?? []);
        setSelectedOS(null);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [machineId]);

  useEffect(() => {
    setPage(1);
  }, [search, status, priority, pageSize]);

  const filtered = useMemo(() => {
    return osList.filter((os) => {
      const descricao = os.descricao ?? "";

      return (
        descricao.toLowerCase().includes(search.toLowerCase()) &&
        (status === "" || os.status === status) &&
        (priority === "" || os.prioridade === priority)
      );
    });
  }, [osList, search, status, priority]);

  const paginated = useMemo(() => {
    return filtered.slice(
      (page - 1) * pageSize,
      page * pageSize
    );
  }, [filtered, page, pageSize]);

  const refreshOsList = async () => {
    const updated = await getOrdensByMachineId(machineId);
    setOsList(updated ?? []);
  };

  const columns = useMemo(
    () =>
      getMachineDetailsColumns(
        (os) => setSelectedOS(os),
        refreshOsList,
        userRole,
        userId,
        tecnicos
      ),
    [tecnicos, machineId]
  );

  const cardColumns = useMemo(
    () =>
      getMachineDetailsMobileColumns(
        (os) => setSelectedOS(os),
        refreshOsList,
        userRole,
        userId,
        tecnicos
      ),
    [tecnicos, machineId]
  );

  // 👇 CREATE OS HANDLER
  async function handleCreateOS(data: OrdemServicoFormData) {
  try {
    const createdOS = await createOrdemServico(data); // 👈 guarda o retorno

    const updated = await getOrdensByMachineId(machineId);
    setOsList(updated ?? []);

    notify.success("Ordem de serviço criada com sucesso");
    return createdOS; // 👈 devolve pro modal poder subir os anexos
  } catch (error) {
    notify.error("Erro ao criar OS");
    console.error("Erro ao criar OS:", error);
    throw error; // 👈 propaga o erro (senão o modal fecha achando que deu certo)
  }
}

  if (!loading && !machine) {
    return (
      <div className="p-4 text-sm text-slate-500">
        Máquina não encontrada
      </div>
    );
  }

  const hasOS = !!selectedOS;

  return (
    <div className="space-y-4 w-full">

      {/* HEADER + AÇÕES */}
      <div className="flex flex-col xl:flex-row gap-4 items-stretch">
        <div className="w-full xl:w-1/2">
          {loading || !machine ? (
            <HeaderSkeleton />
          ) : (
            <MachineDetailsHeader
              machine={machine}
              sectors={sectors}
            />
          )}
        </div>

        <div className="w-full xl:w-1/2">
          {loading || !machine ? (
            <ActionsSkeleton />
          ) : (
            <MachineDetailsActions
              machineId={machine.id}
              osStatus={
                osList.find((os) =>
                  ["aberta", "atribuida", "andamento"].includes(
                    os.status
                  )
                )?.status as any ?? null
              }
              papel={userRole} // 👈 AQUI PASSA O PAPEL DO USUÁRIO
              onCreateOS={() => setOpenCreateOS(true)} // 👈 AQUI ABRE O MODAL
              onViewOS={() => setSelectedOS(osList[0] ?? null)}
            />
          )}
        </div>
      </div>

      {/* TABELA + TIMELINE */}
      <div className={`flex gap-4 items-start ${hasOS ? "xl:flex-row" : ""}`}>

        <div className={`transition-all duration-300 w-full ${hasOS ? "xl:w-[65%]" : "xl:w-full"}`}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

            <div className="p-4 border-b border-slate-200 bg-slate-50/40">
              {loading ? (
                <FiltersSkeleton />
              ) : (
                <MachineDetailsFilters
                  onSearch={setSearch}
                  onStatus={setStatus}
                  onPriority={setPriority}
                />
              )}
            </div>

            <div className="w-full px-2 py-2">
              {loading ? (
                <DataTableLoading />
              ) : (
                <>
                  <div className="hidden sm:block">
                    <DataTable
                      columns={columns}
                      data={paginated}
                      onRowDoubleClick={(row) =>
                        setSelectedOS(row)
                      }
                    />
                  </div>

                  <div className="sm:hidden p-2">
                    <DataCards
                      data={paginated}
                      columns={cardColumns}
                    />
                  </div>
                </>
              )}
            </div>

            <Pagination
              page={page}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>

        {/* TIMELINE DESKTOP */}
        {hasOS && selectedOS && !isMobile && (
          <div className="w-[35%] flex-shrink-0">
            <OrdemServicoTimeline
              os={selectedOS}
              onClose={() => setSelectedOS(null)}
            />
          </div>
        )}
      </div>

      {/* MODAL MOBILE TIMELINE */}
      {isMobile && (
        <Dialog
          open={!!selectedOS}
          onOpenChange={(open) => {
            if (!open) setSelectedOS(null);
          }}
        >
          <DialogContent className="p-0 max-w-[95vw] w-full border-none">
            {selectedOS && (
              <OrdemServicoTimeline
                os={selectedOS}
                onClose={() => setSelectedOS(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* 👇 MODAL CRIAR OS */}
      <OrdemServicoModal
        open={openCreateOS}
        onClose={() => setOpenCreateOS(false)}
        machineId={machineId}
        tecnicos={tecnicosLoading ? [] : tecnicos} // depois você pluga seu hook de técnicos
        onSave={handleCreateOS}
      />
    </div>
  );
}
