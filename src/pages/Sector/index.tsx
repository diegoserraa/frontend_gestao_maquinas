import { useEffect, useMemo, useState } from "react";

import { DataTable } from "@/components/data/DataTable";
import { DataCards } from "@/components/data/DataCard";
import { Pagination } from "@/components/data/Pagination";
import { DataTableLoading } from "@/components/data/DataTableLoading";

import { notify } from "@/lib/notify";

import { ConfirmDialog } from "@/components/modals/machine/confirmDialog";

import type { Sector } from "../../modules/sector/setorTypes";
import { SectorFilters } from "../../modules/sector/sectorFilters";

import {
  getSectors,
  deleteSector,
  createSector,
  updateSector,
} from "@/modules/sector/sectorService";

import { getSectorTableColumns } from "../../modules/sector/sectorTableColumn";
import { getSectorCardColumns } from "../../modules/sector/sectorCardColumn";

import { SectorModal } from "../../components/modals/sector/AdicionarEditarSector";

export default function Sectors() {
  const [data, setData] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [search, setSearch] = useState("");

  const [openModal, setOpenModal] = useState(false);

  const [selectedSector, setSelectedSector] =
    useState<Sector | undefined>();

  const [openDelete, setOpenDelete] = useState(false);

  const [sectorToDelete, setSectorToDelete] =
    useState<Sector | null>(null);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  async function loadSectors() {
    const sectors = await getSectors();
    setData(sectors);
  }

  useEffect(() => {
    async function load() {
      await loadSectors();
      setLoading(false);
    }

    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [pageSize, search]);

  function handleOpenDelete(sector: Sector) {
    setSectorToDelete(sector);
    setOpenDelete(true);
  }

  async function handleDeleteConfirm() {
    if (!sectorToDelete) return;

    try {
      setDeleteLoading(true);

      await deleteSector(sectorToDelete.id);

      setData((prev) =>
        prev.filter(
          (s) => s.id !== sectorToDelete.id
        )
      );

      notify.success("Setor excluído");

      setOpenDelete(false);
      setSectorToDelete(null);
    } catch (error) {
      notify.error("Erro ao excluir setor");
      console.error(error);
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleSave(dataForm: {
    nome: string;
    descricao: string;
  }) {
    try {
      if (selectedSector) {
        await updateSector(
          selectedSector.id,
          dataForm
        );

        notify.success(
          "Setor atualizado"
        );
      } else {
        await createSector(dataForm);

        notify.success(
          "Setor criado"
        );
      }

      await loadSectors();

      setOpenModal(false);
      setSelectedSector(undefined);
    } catch (error) {
      notify.error(
        "Erro ao salvar setor"
      );

      console.error(error);
    }
  }

  const filteredData = useMemo(() => {
    return data.filter((sector) =>
      sector.nome
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [data, search]);

  const paginatedData = useMemo(() => {
    return filteredData.slice(
      (page - 1) * pageSize,
      page * pageSize
    );
  }, [filteredData, page, pageSize]);

  const tableColumns = useMemo(
    () =>
      getSectorTableColumns({
        onEdit: (sector) => {
          setSelectedSector(sector);
          setOpenModal(true);
        },

        onDelete: handleOpenDelete,
      }),
    []
  );

  const cardColumns = useMemo(
    () =>
      getSectorCardColumns(
        (sector) => {
          setSelectedSector(sector);
          setOpenModal(true);
        },

        handleOpenDelete
      ),
    []
  );

  return (
    <div className="space-y-4 w-full max-w-full overflow-x-hidden">

      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Setores
          </h1>

          <p className="text-sm text-slate-500">
            Gestão dos setores da fábrica
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedSector(undefined);
            setOpenModal(true);
          }}
          className="
            w-full
            sm:w-auto
            px-4
            py-2
            text-sm
            rounded-lg
            bg-gradient-to-r
            from-blue-600
            to-indigo-600
            text-white
          "
        >
          + Novo setor
        </button>
      </div>

      {/* CONTAINER */}
      <div
        className="
          w-full
          bg-white
          rounded-2xl
          border
          border-slate-200
          shadow-sm
          overflow-hidden
        "
      >
        {/* FILTER */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/40">
  <SectorFilters
    onSearch={setSearch}
  />
</div>

        {/* CONTENT */}
        <div className="w-full px-2 py-2">

          {loading ? (
            <DataTableLoading />
          ) : (
            <>
              <div className="hidden sm:block">
                <DataTable
                  columns={tableColumns}
                  data={paginatedData}
                />
              </div>

              <div className="sm:hidden p-2">
                <DataCards
                  columns={cardColumns}
                  data={paginatedData}
                />
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

      <SectorModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedSector(undefined);
        }}
        sector={selectedSector}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        title="Excluir setor"
        description={`Deseja excluir o setor "${sectorToDelete?.nome}"?`}
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}