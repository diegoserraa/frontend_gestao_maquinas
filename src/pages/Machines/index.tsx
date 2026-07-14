import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/data/DataTable";
import { Pagination } from "@/components/data/Pagination";
import { DataFilters } from "@/components/data/DataFilters";
import { DataTableLoading } from "@/components/data/DataTableLoading";
import { MachineModal } from "@/components/modals/machine/AdicionarEditarMachine";
import { DataCards } from "@/components/data/DataCard";
import { ConfirmDialog } from "../../components/modals/machine/confirmDialog";
import { notify } from "@/lib/notify";
import {
  uploadMachineAttachments,
  getMachineAttachments,
  deleteAttachment,
} from "../../modules/attachment/attachmentService";

import type { Machine, Setor } from "../../modules/machine/machineTypes";
import type { MachineFormData } from "@/components/forms/MachineForm";
import type { ExistingAttachment } from "@/components/modals/machine/AdicionarEditarMachine";

import {
  toggleMachineStatus,
  deleteMachine,
  getMachines,
  getSectors,
  createMachine,
  updateMachine,
} from "../../modules/machine/machineService";

import { getMachineTableColumns } from "../../modules/machine/machineTableColumns";
import { getMachineCardColumns } from "../../modules/machine/machineCardColumns";
import { useNavigate } from "react-router-dom";

export default function Machines() {
  const [data, setData] = useState<Machine[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [search, setSearch] = useState("");
  const [model, setModel] = useState("");
  const [status, setStatus] = useState("");
  const [setor, setSetor] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const navigate = useNavigate();

  const [selectedMachine, setSelectedMachine] = useState<Machine | undefined>();

  // Anexos existentes carregados ao abrir edição
  const [existingAttachments, setExistingAttachments] = useState<ExistingAttachment[]>([]);

  const [openDelete, setOpenDelete] = useState(false);
  const [machineToDelete, setMachineToDelete] = useState<Machine | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function loadMachines() {
    const machines = await getMachines();
    setData(machines);
  }

  useEffect(() => {
    async function load() {
      await loadMachines();
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    async function loadSetores() {
      const sectors = await getSectors();
      setSetores(sectors);
    }
    loadSetores();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [pageSize, search, model, status, setor]);

  // =========================
  // ABRIR MODAL DE EDIÇÃO
  // Busca os anexos existentes antes de abrir
  // =========================
  async function handleOpenEdit(machine: Machine) {
    setSelectedMachine(machine);
    try {
      const anexos = await getMachineAttachments(machine.id);
      // Mapeia Anexo -> ExistingAttachment
    
setExistingAttachments(
  anexos.map((a) => ({
    id: a.id,
    nome: a.nome_arquivo,
    url: a.url_arquivo,
    tipo: a.tipo_arquivo,
  }))
);
    } catch {
      setExistingAttachments([]);
    }
    setOpenModal(true);
  }

  // =========================
  // TOGGLE STATUS
  // =========================
  async function toggleStatus(id: number) {
    try {
      const updatedMachine = await toggleMachineStatus(id);
      setData((prev) => prev.map((m) => (m.id === id ? updatedMachine : m)));
      notify.success(`Status da máquina "${updatedMachine.nome}" atualizado para "${updatedMachine.status}"`);
    } catch (error) {
      notify.error("Erro ao atualizar status da máquina");
      console.error(error);
    }
  }

  // =========================
  // DELETE
  // =========================
  function handleOpenDelete(machine: Machine) {
    setMachineToDelete(machine);
    setOpenDelete(true);
  }

  async function handleDeleteConfirm() {
    if (!machineToDelete) return;
    try {
      setDeleteLoading(true);
      await deleteMachine(machineToDelete.id);
      setData((prev) => prev.filter((m) => m.id !== machineToDelete.id));
      setOpenDelete(false);
      setMachineToDelete(null);
      notify.success("Máquina excluída");
    } catch (error) {
      notify.error("Erro ao excluir máquina");
      console.error(error);
    } finally {
      setDeleteLoading(false);
    }
  }

  // =========================
  // SAVE — nova assinatura com removedAttachmentIds
  // =========================
  async function handleSave(
    form: MachineFormData,
    newFiles: File[],
    removedAttachmentIds: number[]
  ) {
    try {
      if (selectedMachine) {
        await updateMachine(selectedMachine.id, form);

        // Remove anexos marcados para deletar
        if (removedAttachmentIds.length > 0) {
          await Promise.all(removedAttachmentIds.map((id) => deleteAttachment(id)));
        }

        // Faz upload dos novos anexos
        if (newFiles.length > 0) {
          await uploadMachineAttachments(selectedMachine.id, newFiles);
        }

        notify.success("Máquina atualizada");
      } else {
        const machine = await createMachine(form);

        if (machine?.id && newFiles.length > 0) {
          await uploadMachineAttachments(machine.id, newFiles);
        }

        notify.success("Máquina criada");
      }

      await loadMachines();
      setOpenModal(false);
      setSelectedMachine(undefined);
      setExistingAttachments([]);
    } catch (error) {
      notify.error("Erro ao salvar máquina");
      console.error(error);
    }
  }

  const filteredData = useMemo(() => {
    return data.filter((m) => {
      return (
        m.nome.toLowerCase().includes(search.toLowerCase()) &&
        (model === "" || m.modelo.toLowerCase().includes(model.toLowerCase())) &&
        (status === "" || m.status === status) &&
        (setor === "" || String(m.setor_id) === setor)
      );
    });
  }, [data, search, model, status, setor]);

  const paginatedData = useMemo(() => {
    return filteredData.slice((page - 1) * pageSize, page * pageSize);
  }, [filteredData, page, pageSize]);

  const tableColumns = useMemo(
    () =>
      getMachineTableColumns({
        onEdit: handleOpenEdit,
        onToggle: toggleStatus,
        onDelete: handleOpenDelete,
        onRowClick: (id) => navigate(`/machines/${id}`),
        onViewOS: (id) => navigate(`/machines/${id}?tab=os`),
      }),
    []
  );

  const cardColumns = useMemo(
    () =>
      getMachineCardColumns(
        handleOpenEdit,
        toggleStatus,
        handleOpenDelete,
        (machine) => navigate(`/machines/${machine.id}?tab=history`)
      ),
    []
  );

  return (
    <div className="space-y-4 w-full max-w-full overflow-x-hidden">

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Máquinas</h1>
          <p className="text-sm text-slate-500">Gestão de ativos industriais</p>
        </div>
        <button
          onClick={() => {
            setSelectedMachine(undefined);
            setExistingAttachments([]);
            setOpenModal(true);
          }}
          className="w-full sm:w-auto px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
        >
          + Nova máquina
        </button>
      </div>

      <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/40">
          <DataFilters
            onSearch={setSearch}
            onModelChange={setModel}
            onStatusChange={setStatus}
            onSectorChange={setSetor}
            sectors={setores}
          />
        </div>

        <div className="w-full px-2 py-2">
          {loading ? (
            <DataTableLoading />
          ) : (
            <>
              <div className="hidden sm:block">
                <DataTable columns={tableColumns} data={paginatedData} />
              </div>
              <div className="sm:hidden p-2">
                <DataCards data={paginatedData} columns={cardColumns} />
              </div>
            </>
          )}
        </div>

        <Pagination
          page={page}
          totalItems={filteredData.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <MachineModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedMachine(undefined);
          setExistingAttachments([]);
        }}
        sectors={setores}
        machine={selectedMachine}
        existingAttachments={existingAttachments}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        title="Excluir máquina"
        description={`Deseja excluir a máquina "${machineToDelete?.nome}"?`}
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}