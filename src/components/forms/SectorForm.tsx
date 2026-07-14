import { useState } from "react";
import { Building2, FileText } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type SectorFormData = {
  nome: string;
  descricao: string;
};

type Props = {
  loading?: boolean;
  initialData?: Partial<SectorFormData>;
  onSubmit: (data: SectorFormData) => void;
};

type FormErrors = Partial<
  Record<keyof SectorFormData, string>
>;

export function SectorForm({
  loading,
  initialData,
  onSubmit,
}: Props) {
  const [form, setForm] =
    useState<SectorFormData>({
      nome: initialData?.nome ?? "",
      descricao:
        initialData?.descricao ?? "",
    });

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [touched, setTouched] =
    useState<
      Partial<
        Record<
          keyof SectorFormData,
          boolean
        >
      >
    >({});

  function touch(
    field: keyof SectorFormData
  ) {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  }

  function validate(
    values: SectorFormData
  ): FormErrors {
    const errs: FormErrors = {};

    if (!values.nome.trim()) {
      errs.nome =
        "Nome é obrigatório.";
    }

    if (!values.descricao.trim()) {
      errs.descricao =
        "Descrição é obrigatória.";
    }

    return errs;
  }

  function handleChange<
    K extends keyof SectorFormData
  >(
    field: K,
    value: SectorFormData[K]
  ) {
    const updated = {
      ...form,
      [field]: value,
    };

    setForm(updated);

    if (touched[field]) {
      const errs =
        validate(updated);

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

    const allTouched = {
      nome: true,
      descricao: true,
    };

    setTouched(allTouched);

    const errs =
      validate(form);

    setErrors(errs);

    if (
      Object.keys(errs).length === 0
    ) {
      onSubmit({
        nome: form.nome.trim(),
        descricao:
          form.descricao.trim(),
      });
    }
  }

  const baseInput =
    "h-11 w-full rounded-xl border bg-white px-4 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 transition-all duration-150 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500";

  const inputClass = (
    field: keyof SectorFormData
  ) =>
    `${baseInput} ${
      touched[field] &&
      errors[field]
        ? "border-red-400 focus:ring-red-100 focus:border-red-400"
        : "border-slate-200 hover:border-slate-300"
    }`;

  const textareaClass = (
    field: keyof SectorFormData
  ) =>
    `
      w-full
      rounded-xl
      border
      bg-white

      pl-10
      pr-4
      py-3

      text-sm
      text-slate-700

      shadow-sm

      resize-none

      placeholder:text-slate-400

      transition-all
      duration-150

      hover:shadow-md

      focus:outline-none
      focus:ring-2

      ${
        touched[field] &&
        errors[field]
          ? `
            border-red-400
            focus:ring-red-100
            focus:border-red-400
          `
          : `
            border-slate-200
            hover:border-slate-300
            focus:ring-blue-100
            focus:border-blue-500
          `
      }
    `;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full"
    >
      <div className="space-y-5">
        {/* NOME */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">
            Nome do Setor{" "}
            <span className="text-red-400">
              *
            </span>
          </label>

          <div className="relative">
            <Building2
              size={15}
              className="
                absolute
                left-3.5
                top-1/2
                -translate-y-1/2
                text-slate-400
                pointer-events-none
              "
            />

            <Input
              value={form.nome}
              placeholder="Ex: Produção"
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

        {/* DESCRIÇÃO */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">
            Descrição{" "}
            <span className="text-red-400">
              *
            </span>
          </label>

          <div className="relative">
            <FileText
              size={15}
              className="
                absolute
                left-3.5
                top-4
                text-slate-400
                pointer-events-none
              "
            />

            <textarea
              rows={4}
              value={form.descricao}
              placeholder="Descreva o setor..."
              className={textareaClass(
                "descricao"
              )}
              onChange={(e) =>
                handleChange(
                  "descricao",
                  e.target.value
                )
              }
              onBlur={() =>
                touch(
                  "descricao"
                )
              }
            />
          </div>

          {touched.descricao &&
            errors.descricao && (
              <p className="text-xs text-red-500">
                {errors.descricao}
              </p>
            )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex justify-end pt-6">
        <Button
          type="submit"
          disabled={loading}
          className="
            h-11
            px-8
            rounded-xl
            bg-gradient-to-r
            from-blue-600
            to-indigo-600
            text-white
            text-sm
            font-medium
            shadow-sm
            hover:opacity-90
            active:scale-[0.98]
            transition-all
            disabled:opacity-60
          "
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span
                className="
                  h-4
                  w-4
                  rounded-full
                  border-2
                  border-white
                  border-t-transparent
                  animate-spin
                "
              />
              Salvando...
            </span>
          ) : (
            "Salvar setor"
          )}
        </Button>
      </div>
    </form>
  );
}