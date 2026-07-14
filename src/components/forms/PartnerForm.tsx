import { useState } from "react";

import {
  Building2,
  FileText,
  Phone,
  Mail,
  BadgeInfo,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type PartnerFormData = {
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  observacoes: string;
};

type Props = {
  loading?: boolean;
  initialData?: Partial<PartnerFormData>;
  onSubmit: (data: PartnerFormData) => void;
};

type FormErrors = Partial<Record<keyof PartnerFormData, string>>;

export function PartnerForm({ loading, initialData, onSubmit }: Props) {
  const [form, setForm] = useState<PartnerFormData>({
    nome: initialData?.nome ?? "",
    cnpj: initialData?.cnpj ?? "",
    telefone: initialData?.telefone ?? "",
    email: initialData?.email ?? "",
    observacoes: initialData?.observacoes ?? "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof PartnerFormData, boolean>>>({});

  function touch(field: keyof PartnerFormData) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function maskCnpj(value: string) {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 18);
  }

  function maskPhone(value: string) {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 15);
  }

  function validate(values: PartnerFormData): FormErrors {
    const errs: FormErrors = {};
    if (!values.nome.trim()) errs.nome = "Nome é obrigatório.";
    if (values.cnpj && values.cnpj.replace(/\D/g, "").length !== 14)
      errs.cnpj = "CNPJ inválido.";
    if (values.telefone && values.telefone.replace(/\D/g, "").length < 10)
      errs.telefone = "Telefone inválido.";
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      errs.email = "E-mail inválido.";
    return errs;
  }

  function handleChange<K extends keyof PartnerFormData>(field: K, value: PartnerFormData[K]) {
    let finalValue = value;
    if (field === "cnpj") finalValue = maskCnpj(value as string) as PartnerFormData[K];
    if (field === "telefone") finalValue = maskPhone(value as string) as PartnerFormData[K];

    const updated = { ...form, [field]: finalValue };
    setForm(updated);

    if (touched[field]) {
      const errs = validate(updated);
      setErrors((prev) => ({ ...prev, [field]: errs[field] }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ nome: true, cnpj: true, telefone: true, email: true, observacoes: true });
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      onSubmit({
        ...form,
        nome: form.nome.trim(),
        email: form.email.trim(),
        observacoes: form.observacoes.trim(),
      });
    }
  }

  const baseInput =
    "h-10 w-full rounded-xl border bg-white px-4 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 transition-all duration-150 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500";

  const inputClass = (field: keyof PartnerFormData) =>
    `${baseInput} ${
      touched[field] && errors[field]
        ? "border-red-400 focus:ring-red-100 focus:border-red-400"
        : "border-slate-200 hover:border-slate-300"
    }`;

  const textareaClass = (field: keyof PartnerFormData) =>
    `w-full rounded-xl border bg-white pl-10 pr-2 py-2.5 text-sm text-slate-700 shadow-sm resize-none placeholder:text-slate-400 transition-all duration-150 hover:shadow-md focus:outline-none focus:ring-2 ${
      touched[field] && errors[field]
        ? "border-red-400 focus:ring-red-100 focus:border-red-400"
        : "border-slate-200 hover:border-slate-300 focus:ring-blue-100 focus:border-blue-500"
    }`;

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col gap-3">

      {/* NOME */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">
          Nome do Parceiro <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={form.nome}
            placeholder="Ex: Mecânica Silva"
            className={`${inputClass("nome")} pl-10`}
            onChange={(e) => handleChange("nome", e.target.value)}
            onBlur={() => touch("nome")}
          />
        </div>
        {touched.nome && errors.nome && <p className="text-xs text-red-500">{errors.nome}</p>}
      </div>

      {/* CNPJ + TELEFONE */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">CNPJ</label>
          <div className="relative">
            <BadgeInfo size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={form.cnpj}
              placeholder="00.000.000/0000-00"
              className={`${inputClass("cnpj")} pl-10`}
              onChange={(e) => handleChange("cnpj", e.target.value)}
              onBlur={() => touch("cnpj")}
            />
          </div>
          {touched.cnpj && errors.cnpj && <p className="text-xs text-red-500">{errors.cnpj}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Telefone</label>
          <div className="relative">
            <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={form.telefone}
              placeholder="(32) 99999-9999"
              className={`${inputClass("telefone")} pl-10`}
              onChange={(e) => handleChange("telefone", e.target.value)}
              onBlur={() => touch("telefone")}
            />
          </div>
          {touched.telefone && errors.telefone && <p className="text-xs text-red-500">{errors.telefone}</p>}
        </div>
      </div>

      {/* EMAIL */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">E-mail</label>
        <div className="relative">
          <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={form.email}
            placeholder="contato@empresa.com"
            className={`${inputClass("email")} pl-10`}
            onChange={(e) => handleChange("email", e.target.value)}
            onBlur={() => touch("email")}
          />
        </div>
        {touched.email && errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
      </div>

      {/* OBSERVAÇÕES */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Observações</label>
        <div className="relative">
          <FileText size={15} className="absolute left-3.5 top-3 text-slate-400" />
          <textarea
            rows={3}
            value={form.observacoes}
            placeholder="Informações adicionais..."
            className={textareaClass("observacoes")}
            onChange={(e) => handleChange("observacoes", e.target.value)}
            onBlur={() => touch("observacoes")}
          />
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex justify-end pt-1">
        <Button
          type="submit"
          disabled={loading}
          className="h-10 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Salvando...
            </span>
          ) : (
            "Salvar parceiro"
          )}
        </Button>
      </div>
    </form>
  );
}