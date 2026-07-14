import { useState } from "react";
import { Building2, Factory, Wrench, Boxes, Calendar, ImagePlus, X, ZoomIn } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Sector = {
  id: number;
  nome: string;
};

export type MachineFormData = {
  nome: string;
  modelo: string;
  fabricante: string;
  ano: number;
  status: string;
  setor_id: number;
  intervalo_manutencao_dias: number;
  imagem?: File | null;
  imagem_url?: string | null;
};

type FormErrors = Partial<Record<keyof MachineFormData, string>>;

type Props = {
  sectors: Sector[];
  loading?: boolean;
  initialData?: Partial<MachineFormData>;
  onSubmit: (data: MachineFormData) => void;
  mode?: "create" | "edit";
};

function validate(form: MachineFormData, sectors: Sector[]): FormErrors {
  const errors: FormErrors = {};
  if (!form.nome.trim()) errors.nome = "Nome é obrigatório.";
  if (!form.modelo.trim()) errors.modelo = "Modelo é obrigatório.";
  if (!form.fabricante.trim()) errors.fabricante = "Fabricante é obrigatório.";
  const currentYear = new Date().getFullYear();
  if (!form.ano || form.ano < 1900 || form.ano > currentYear)
    errors.ano = `Ano deve ser entre 1900 e ${currentYear}.`;
  if (!form.setor_id || !sectors.find((s) => s.id === form.setor_id))
    errors.setor_id = "Selecione um setor.";
  if (!form.status) errors.status = "Selecione um status.";
  if (!form.intervalo_manutencao_dias || form.intervalo_manutencao_dias < 1)
    errors.intervalo_manutencao_dias = "Intervalo deve ser maior que 0.";
  return errors;
}

export function MachineForm({ sectors, loading, initialData, onSubmit }: Props) {
  const [form, setForm] = useState<MachineFormData>({
    nome: initialData?.nome ?? "",
    modelo: initialData?.modelo ?? "",
    fabricante: initialData?.fabricante ?? "",
    ano: initialData?.ano ?? new Date().getFullYear(),
    status: initialData?.status ?? "ativa",
    setor_id: initialData?.setor_id ?? 0,
    intervalo_manutencao_dias: initialData?.intervalo_manutencao_dias ?? 90,
  });

  const [previewImagem, setPreviewImagem] = useState<string | null>(
    initialData?.imagem_url ?? null
  );
  const [zoomOpen, setZoomOpen] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof MachineFormData, boolean>>>({});

  function touch(field: keyof MachineFormData) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const allTouched = Object.fromEntries(
      Object.keys(form).map((k) => [k, true])
    ) as Partial<Record<keyof MachineFormData, boolean>>;
    setTouched(allTouched);
    const errs = validate(form, sectors);
    setErrors(errs);
    if (Object.keys(errs).length === 0) onSubmit(form);
  }

  function handleChange<K extends keyof MachineFormData>(field: K, value: MachineFormData[K]) {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (touched[field]) {
      const errs = validate(updated, sectors);
      setErrors((prev) => ({ ...prev, [field]: errs[field] }));
    }
  }

  function handleRemoveImage() {
    setPreviewImagem(null);
    setZoomOpen(false);
    setForm((prev) => ({ ...prev, imagem: null, imagem_url: null }));
  }

  const baseInput =
    "h-10 w-full rounded-xl border bg-white px-4 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 transition-all duration-150 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500";

  const inputClass = (field: keyof MachineFormData) =>
    `${baseInput} ${
      touched[field] && errors[field]
        ? "border-red-400 focus:ring-red-100 focus:border-red-400"
        : "border-slate-200 hover:border-slate-300"
    }`;

  const selectTriggerClass = (field: keyof MachineFormData) =>
    `h-10 w-full rounded-xl border bg-white px-4 text-sm shadow-sm transition-all duration-150 hover:shadow-md focus:ring-2 ${
      touched[field] && errors[field]
        ? "border-red-400 focus:ring-red-100 focus:border-red-400"
        : "border-slate-200 hover:border-slate-300 focus:ring-blue-100 focus:border-blue-500"
    }`;

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="w-full space-y-4">

        {/* GRID PRINCIPAL */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">

          {/* FOTO */}
          <div className="col-span-2 flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
            <label className="relative group cursor-pointer shrink-0">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setForm((prev) => ({ ...prev, imagem: file }));
                  setPreviewImagem(URL.createObjectURL(file));
                }}
              />
              {previewImagem ? (
                <div
                  className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 shadow-sm"
                  onClick={(e) => {
                    // clique na imagem abre zoom, não o file picker
                    e.preventDefault();
                    setZoomOpen(true);
                  }}
                >
                  <img src={previewImagem} alt="Foto da máquina" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn size={16} className="text-white" />
                  </div>
                </div>
              ) : (
                <div className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center gap-0.5 hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <ImagePlus size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <span className="text-[9px] text-slate-400 group-hover:text-blue-500 transition-colors leading-tight text-center">foto</span>
                </div>
              )}
            </label>

            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="text-sm font-medium text-slate-700">Foto da Máquina</p>
              <p className="text-xs text-slate-400">Opcional · JPG, PNG ou WEBP</p>
              {previewImagem && (
                <div className="flex items-center gap-2 mt-0.5">
                  <button
                    type="button"
                    onClick={() => setZoomOpen(true)}
                    className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
                  >
                    Ver foto
                  </button>
                  <span className="text-slate-300 text-xs">·</span>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    <X size={11} />
                    Remover
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* NOME */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">
              Nome da Máquina <span className="text-red-400">*</span>
            </label>
            <Input
              value={form.nome}
              placeholder="Ex: Injetora Principal"
              className={inputClass("nome")}
              onChange={(e) => handleChange("nome", e.target.value)}
              onBlur={() => touch("nome")}
            />
            {touched.nome && errors.nome && <p className="text-xs text-red-500">{errors.nome}</p>}
          </div>

          {/* MODELO */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">
              Modelo <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Boxes size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input
                value={form.modelo}
                placeholder="Ex: INJ-1000"
                className={`${inputClass("modelo")} pl-9`}
                onChange={(e) => handleChange("modelo", e.target.value)}
                onBlur={() => touch("modelo")}
              />
            </div>
            {touched.modelo && errors.modelo && <p className="text-xs text-red-500">{errors.modelo}</p>}
          </div>

          {/* FABRICANTE */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">
              Fabricante <span className="text-red-400">*</span>
            </label>
            <Input
              value={form.fabricante}
              placeholder="Ex: Sandretto"
              className={inputClass("fabricante")}
              onChange={(e) => handleChange("fabricante", e.target.value)}
              onBlur={() => touch("fabricante")}
            />
            {touched.fabricante && errors.fabricante && <p className="text-xs text-red-500">{errors.fabricante}</p>}
          </div>

          {/* ANO */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">
              Ano <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input
                type="number"
                value={form.ano}
                min={1900}
                max={new Date().getFullYear()}
                className={`${inputClass("ano")} pl-9`}
                onChange={(e) => handleChange("ano", Number(e.target.value))}
                onBlur={() => touch("ano")}
              />
            </div>
            {touched.ano && errors.ano && <p className="text-xs text-red-500">{errors.ano}</p>}
          </div>

          {/* SETOR */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">
              Setor <span className="text-red-400">*</span>
            </label>
            <Select
              value={form.setor_id ? String(form.setor_id) : ""}
              onValueChange={(v) => { handleChange("setor_id", Number(v)); touch("setor_id"); }}
            >
              <SelectTrigger className={selectTriggerClass("setor_id")} onBlur={() => touch("setor_id")}>
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-slate-400 shrink-0" />
                  <SelectValue placeholder="Selecione um setor" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {sectors.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {touched.setor_id && errors.setor_id && <p className="text-xs text-red-500">{errors.setor_id}</p>}
          </div>

          {/* STATUS */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">
              Status <span className="text-red-400">*</span>
            </label>
            <Select
              value={form.status}
              onValueChange={(v) => { handleChange("status", v); touch("status"); }}
            >
              <SelectTrigger className={selectTriggerClass("status")} onBlur={() => touch("status")}>
                <div className="flex items-center gap-2">
                  <Factory size={14} className="text-slate-400 shrink-0" />
                  <SelectValue placeholder="Selecione o status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativa">Ativa</SelectItem>
                <SelectItem value="inativa">Inativa</SelectItem>
              </SelectContent>
            </Select>
            {touched.status && errors.status && <p className="text-xs text-red-500">{errors.status}</p>}
          </div>

          {/* INTERVALO */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-medium text-slate-600">
              Intervalo de manutenção (dias) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Wrench size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input
                type="number"
                min={1}
                value={form.intervalo_manutencao_dias}
                className={`${inputClass("intervalo_manutencao_dias")} pl-9`}
                onChange={(e) => handleChange("intervalo_manutencao_dias", Number(e.target.value))}
                onBlur={() => touch("intervalo_manutencao_dias")}
              />
            </div>
            {touched.intervalo_manutencao_dias && errors.intervalo_manutencao_dias && (
              <p className="text-xs text-red-500">{errors.intervalo_manutencao_dias}</p>
            )}
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
              "Salvar máquina"
            )}
          </Button>
        </div>
      </form>

      {/* MODAL ZOOM DA FOTO */}
      {zoomOpen && previewImagem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setZoomOpen(false)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-2xl w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
              <p className="text-sm font-medium text-slate-700">Foto da Máquina</p>
              <button
                type="button"
                onClick={() => setZoomOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-50 p-4 min-h-0">
              <img
                src={previewImagem}
                alt="Foto da máquina"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}