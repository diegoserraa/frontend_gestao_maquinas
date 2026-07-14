import { useState } from "react";

import {
  User,
  Mail,
  Shield,
  Lock,
  Power,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type UserFormData = {
  nome: string;
  email: string;
  senha?: string;
  role: string;
  ativo: boolean;
};

type Props = {
  loading?: boolean;
  initialData?: Partial<UserFormData>;
  mode?: "create" | "edit";
  onSubmit: (data: UserFormData) => void;
};

type FormErrors = Partial<
  Record<keyof UserFormData, string>
>;

function validate(
  form: UserFormData,
  mode: "create" | "edit"
): FormErrors {
  const errors: FormErrors = {};

  if (!form.nome.trim()) {
    errors.nome = "Nome é obrigatório.";
  }

  if (!form.email.trim()) {
    errors.email = "E-mail é obrigatório.";
  }

  if (
    form.email &&
    !/\S+@\S+\.\S+/.test(form.email)
  ) {
    errors.email = "E-mail inválido.";
  }

  if (!form.role) {
    errors.role = "Selecione um perfil.";
  }

  if (
    mode === "create" &&
    !form.senha?.trim()
  ) {
    errors.senha = "Senha é obrigatória.";
  }

  return errors;
}

export function UserForm({
  loading,
  initialData,
  onSubmit,
  mode = "create",
}: Props) {
  const [form, setForm] =
    useState<UserFormData>({
      nome: initialData?.nome ?? "",
      email: initialData?.email ?? "",
      senha: "",
      role:
        initialData?.role ??
        "OPERADOR",
      ativo:
        initialData?.ativo ?? true,
    });

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [touched, setTouched] =
    useState<
      Partial<
        Record<
          keyof UserFormData,
          boolean
        >
      >
    >({});

  function touch(
    field: keyof UserFormData
  ) {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  }

  function handleChange<
    K extends keyof UserFormData
  >(
    field: K,
    value: UserFormData[K]
  ) {
    const updated = {
      ...form,
      [field]: value,
    };

    setForm(updated);

    if (touched[field]) {
      const errs = validate(
        updated,
        mode
      );

      setErrors((prev) => ({
        ...prev,
        [field]: errs[field],
      }));
    }
  }

  function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const allTouched =
      Object.fromEntries(
        Object.keys(form).map((k) => [
          k,
          true,
        ])
      ) as Partial<
        Record<
          keyof UserFormData,
          boolean
        >
      >;

    setTouched(allTouched);

    const errs = validate(
      form,
      mode
    );

    setErrors(errs);

    if (
      Object.keys(errs).length === 0
    ) {
      onSubmit(form);
    }
  }

  const baseInput =
    "h-11 w-full rounded-xl border bg-white px-4 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 transition-all duration-150 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500";

  const inputClass = (
    field: keyof UserFormData
  ) =>
    `${baseInput} ${
      touched[field] &&
      errors[field]
        ? "border-red-400 focus:ring-red-100 focus:border-red-400"
        : "border-slate-200 hover:border-slate-300"
    }`;

  const selectTriggerClass = (
    field: keyof UserFormData
  ) =>
    `h-11 w-full rounded-xl border bg-white px-4 text-sm shadow-sm transition-all duration-150 hover:shadow-md focus:ring-2 ${
      touched[field] &&
      errors[field]
        ? "border-red-400 focus:ring-red-100 focus:border-red-400"
        : "border-slate-200 hover:border-slate-300 focus:ring-blue-100 focus:border-blue-500"
    }`;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">

        {/* NOME */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">
            Nome
            <span className="text-red-400">
              {" "}*
            </span>
          </label>

          <div className="relative">
            <User
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <Input
              value={form.nome}
              placeholder="Nome do usuário"
              className={`${inputClass(
                "nome"
              )} pl-10`}
              onChange={(e) =>
                handleChange(
                  "nome",
                  e.target.value
                )
              }
              onBlur={() =>
                touch("nome")
              }
            />
          </div>

          {touched.nome &&
            errors.nome && (
              <p className="text-xs text-red-500">
                {errors.nome}
              </p>
            )}
        </div>

        {/* EMAIL */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">
            E-mail
            <span className="text-red-400">
              {" "}*
            </span>
          </label>

          <div className="relative">
            <Mail
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <Input
              value={form.email}
              placeholder="usuario@email.com"
              className={`${inputClass(
                "email"
              )} pl-10`}
              onChange={(e) =>
                handleChange(
                  "email",
                  e.target.value
                )
              }
              onBlur={() =>
                touch("email")
              }
            />
          </div>

          {touched.email &&
            errors.email && (
              <p className="text-xs text-red-500">
                {errors.email}
              </p>
            )}
        </div>

        {/* PERFIL */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">
            Perfil
            <span className="text-red-400">
              {" "}*
            </span>
          </label>

          <Select
            value={form.role}
            onValueChange={(v) => {
              handleChange("role", v);
              touch("role");
            }}
          >
            <SelectTrigger
              className={selectTriggerClass(
                "role"
              )}
            >
              <div className="flex items-center gap-2">
                <Shield
                  size={15}
                  className="text-slate-400"
                />
                <SelectValue />
              </div>
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ADMIN">
                Administrador
              </SelectItem>

              <SelectItem value="GESTOR">
                Gestor
              </SelectItem>

              <SelectItem value="TECNICO">
                Técnico
              </SelectItem>

              <SelectItem value="OPERADOR">
                Operador
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* STATUS */}
        {mode === "edit" && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Status
            </label>

            <Select
              value={
                form.ativo
                  ? "ativo"
                  : "inativo"
              }
              onValueChange={(v) =>
                handleChange(
                  "ativo",
                  v === "ativo"
                )
              }
            >
              <SelectTrigger
                className={selectTriggerClass(
                  "ativo"
                )}
              >
                <div className="flex items-center gap-2">
                  <Power
                    size={15}
                    className="text-slate-400"
                  />
                  <SelectValue />
                </div>
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ativo">
                  Ativo
                </SelectItem>

                <SelectItem value="inativo">
                  Inativo
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* SENHA */}
        {mode === "create" && (
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-sm font-medium text-slate-700">
              Senha
              <span className="text-red-400">
                {" "}*
              </span>
            </label>

            <div className="relative">
              <Lock
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <Input
                type="password"
                value={form.senha}
                placeholder="Digite a senha"
                className={`${inputClass(
                  "senha"
                )} pl-10`}
                onChange={(e) =>
                  handleChange(
                    "senha",
                    e.target.value
                  )
                }
                onBlur={() =>
                  touch("senha")
                }
              />
            </div>

            {touched.senha &&
              errors.senha && (
                <p className="text-xs text-red-500">
                  {errors.senha}
                </p>
              )}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-6">
        <Button
          type="submit"
          disabled={loading}
          className="h-11 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
        >
          {loading
            ? "Salvando..."
            : "Salvar usuário"}
        </Button>
      </div>
    </form>
  );
}