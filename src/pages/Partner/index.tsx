import { useEffect, useMemo, useState } from "react";

import { DataTable } from "@/components/data/DataTable";
import { DataCards } from "@/components/data/DataCard";
import { Pagination } from "@/components/data/Pagination";
import { DataTableLoading } from "@/components/data/DataTableLoading";

import { notify } from "@/lib/notify";

import { ConfirmDialog } from "@/components/modals/machine/confirmDialog";

import type { Partner } from "@/modules/partner/partnerTypes";

import { PartnerFilters } from "@/modules/partner/partnerFilters";

import {
  getPartners,
  createPartner,
  updatePartner,
  deletePartner,
} from "@/modules/partner/partnerService";

import { getPartnerTableColumns } from "@/modules/partner/partnerTableColumn";
import { getPartnerCardColumns } from "@/modules/partner/partnerCardColumn";

import { PartnerModal } from "@/components/modals/partner/AdicionarEditarPartner";

export default function Partners() {
  const [data, setData] =
    useState<Partner[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [page, setPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(5);

  const [search, setSearch] =
    useState("");

  const [openModal, setOpenModal] =
    useState(false);

  const [selectedPartner, setSelectedPartner] =
    useState<Partner | undefined>();

  const [openDelete, setOpenDelete] =
    useState(false);

  const [partnerToDelete, setPartnerToDelete] =
    useState<Partner | null>(null);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  async function loadPartners() {
    const partners =
      await getPartners();

    setData(partners);
  }

  useEffect(() => {
    async function load() {
      await loadPartners();
      setLoading(false);
    }

    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [pageSize, search]);

  function handleOpenDelete(
    partner: Partner
  ) {
    setPartnerToDelete(partner);
    setOpenDelete(true);
  }

  async function handleDeleteConfirm() {
    if (!partnerToDelete) return;

    try {
      setDeleteLoading(true);

      await deletePartner(
        partnerToDelete.id
      );

      setData((prev) =>
        prev.filter(
          (p) =>
            p.id !==
            partnerToDelete.id
        )
      );

      notify.success(
        "Parceiro excluído"
      );

      setOpenDelete(false);
      setPartnerToDelete(null);
    } catch {
      notify.error(
        "Erro ao excluir parceiro"
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleSave(
    dataForm: any
  ) {
    try {
      if (selectedPartner) {
        await updatePartner(
          selectedPartner.id,
          dataForm
        );

        notify.success(
          "Parceiro atualizado"
        );
      } else {
        await createPartner(
          dataForm
        );

        notify.success(
          "Parceiro criado"
        );
      }

      await loadPartners();

      setOpenModal(false);
      setSelectedPartner(undefined);
    } catch {
      notify.error(
        "Erro ao salvar parceiro"
      );
    }
  }

  const filteredData =
    useMemo(() => {
      return data.filter(
        (partner) =>
          partner.nome
            .toLowerCase()
            .includes(
              search.toLowerCase()
            )
      );
    }, [data, search]);

  const paginatedData =
    useMemo(() => {
      return filteredData.slice(
        (page - 1) * pageSize,
        page * pageSize
      );
    }, [
      filteredData,
      page,
      pageSize,
    ]);

  const tableColumns =
    useMemo(
      () =>
        getPartnerTableColumns({
          onEdit: (
            partner
          ) => {
            setSelectedPartner(
              partner
            );

            setOpenModal(true);
          },

          onDelete:
            handleOpenDelete,
        }),
      []
    );

  const cardColumns =
    useMemo(
      () =>
        getPartnerCardColumns(
          (partner) => {
            setSelectedPartner(
              partner
            );

            setOpenModal(true);
          },

          handleOpenDelete
        ),
      []
    );

  return (
    <div className="space-y-4 w-full max-w-full overflow-x-hidden">

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Parceiros
          </h1>

          <p className="text-sm text-slate-500">
            Gestão de fornecedores e prestadores de serviço
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedPartner(
              undefined
            );

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
          + Novo parceiro
        </button>
      </div>

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
        <div className="p-4 border-b border-slate-200 bg-slate-50/40">
          <PartnerFilters
            onSearch={setSearch}
          />
        </div>

        <div className="w-full px-2 py-2">
          {loading ? (
            <DataTableLoading />
          ) : (
            <>
              <div className="hidden sm:block">
                <DataTable
                  columns={
                    tableColumns
                  }
                  data={
                    paginatedData
                  }
                />
              </div>

              <div className="sm:hidden p-2">
                <DataCards
                  columns={
                    cardColumns
                  }
                  data={
                    paginatedData
                  }
                />
              </div>
            </>
          )}
        </div>

        <Pagination
          page={page}
          totalItems={
            filteredData.length
          }
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={
            setPageSize
          }
        />
      </div>

      <PartnerModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedPartner(
            undefined
          );
        }}
        partner={
          selectedPartner
        }
        onSave={handleSave}
      />

      <ConfirmDialog
        open={openDelete}
        onOpenChange={
          setOpenDelete
        }
        title="Excluir parceiro"
        description={`Deseja excluir o parceiro "${partnerToDelete?.nome}"?`}
        loading={deleteLoading}
        onConfirm={
          handleDeleteConfirm
        }
      />
    </div>
  );
}