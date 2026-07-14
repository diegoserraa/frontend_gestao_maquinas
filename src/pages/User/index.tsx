import { useEffect, useMemo, useState } from "react";

import { DataTable } from "@/components/data/DataTable";
import { DataCards } from "@/components/data/DataCard";
import { Pagination } from "@/components/data/Pagination";
import { DataTableLoading } from "@/components/data/DataTableLoading";

import { notify } from "@/lib/notify";

import { ConfirmDialog } from "@/components/modals/machine/confirmDialog";

import type { User } from "../../modules/user/userType";

import { UserFilters } from "../../modules/user/userFilters";

import {
  getUsers,
  deleteUser,
  createUser,
  updateUser,
  toggleUserStatus,
} from "@/modules/user/userService";

import { getUserTableColumns } from "../../modules/user/userTableColumn";
import { getUserCardColumns } from "../../modules/user/userCardColumn";

import { UserModal } from "../../components/modals/user/AdicionarEditarUser";

export default function Users() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [openModal, setOpenModal] = useState(false);

  const [selectedUser, setSelectedUser] =
    useState<User | undefined>();

  const [openDelete, setOpenDelete] =
    useState(false);

  const [userToDelete, setUserToDelete] =
    useState<User | null>(null);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  const [nameSearch, setNameSearch] =
    useState("");

  const [emailSearch, setEmailSearch] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState("");

  async function loadUsers() {
    const users = await getUsers();
    setData(users);
  }

  useEffect(() => {
    async function load() {
      await loadUsers();
      setLoading(false);
    }

    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [
    pageSize,
    nameSearch,
    emailSearch,
    roleFilter,
  ]);

  function handleOpenDelete(user: User) {
    setUserToDelete(user);
    setOpenDelete(true);
  }

  async function handleDeleteConfirm() {
    if (!userToDelete) return;

    try {
      setDeleteLoading(true);

      await deleteUser(userToDelete.id);

      setData((prev) =>
        prev.filter(
          (u) => u.id !== userToDelete.id
        )
      );

      notify.success("Usuário excluído");

      setOpenDelete(false);
      setUserToDelete(null);
    } catch (error) {
      notify.error(
        "Erro ao excluir usuário"
      );

      console.error(error);
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleToggleUser(
    id: number
  ) {
    try {
      await toggleUserStatus(id);

      await loadUsers();

      notify.success(
        "Status do usuário atualizado"
      );
    } catch (error) {
      notify.error(
        "Erro ao alterar status do usuário"
      );

      console.error(error);
    }
  }

  async function handleSave(
    dataForm: any
  ) {
    try {
      if (selectedUser) {
        await updateUser(
          selectedUser.id,
          {
            nome: dataForm.nome,
            email: dataForm.email,
            role: dataForm.role,
            ativo: dataForm.ativo,
          }
        );

        notify.success(
          "Usuário atualizado"
        );
      } else {
        await createUser({
          nome: dataForm.nome,
          email: dataForm.email,
          senha: dataForm.senha,
          role: dataForm.role,
        });

        notify.success(
          "Usuário criado"
        );
      }

      await loadUsers();

      setOpenModal(false);
      setSelectedUser(undefined);
    } catch (error) {
      notify.error(
        "Erro ao salvar usuário"
      );

      console.error(error);
    }
  }

  const filteredData = useMemo(() => {
    return data.filter((user) => {
      const matchName = user.nome
        .toLowerCase()
        .includes(
          nameSearch.toLowerCase()
        );

      const matchEmail = user.email
        .toLowerCase()
        .includes(
          emailSearch.toLowerCase()
        );

      const matchRole =
        !roleFilter ||
        user.role === roleFilter;

      return (
        matchName &&
        matchEmail &&
        matchRole
      );
    });
  }, [
    data,
    nameSearch,
    emailSearch,
    roleFilter,
  ]);

  const paginatedData = useMemo(() => {
    return filteredData.slice(
      (page - 1) * pageSize,
      page * pageSize
    );
  }, [
    filteredData,
    page,
    pageSize,
  ]);

  const tableColumns = useMemo(
    () =>
      getUserTableColumns({
        onEdit: (user) => {
          setSelectedUser(user);
          setOpenModal(true);
        },

        onToggle: handleToggleUser,

        onDelete: handleOpenDelete,
      }),
    []
  );

  const cardColumns = useMemo(
    () =>
      getUserCardColumns(
        (user) => {
          setSelectedUser(user);
          setOpenModal(true);
        },

        handleToggleUser,

        handleOpenDelete
      ),
    []
  );

  return (
    <div className="space-y-4 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Usuários
          </h1>

          <p className="text-sm text-slate-500">
            Gestão dos usuários do
            sistema
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedUser(
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
          + Novo usuário
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
          <UserFilters
            onNameSearch={
              setNameSearch
            }
            onEmailSearch={
              setEmailSearch
            }
            onRoleChange={
              setRoleFilter
            }
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

      <UserModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedUser(
            undefined
          );
        }}
        user={selectedUser}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={openDelete}
        onOpenChange={
          setOpenDelete
        }
        title="Excluir usuário"
        description={`Deseja excluir o usuário "${userToDelete?.nome}"?`}
        loading={deleteLoading}
        onConfirm={
          handleDeleteConfirm
        }
      />
    </div>
  );
}