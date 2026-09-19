"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { classesLogo } from "@/lib/escola";

type FileUploadProps = {
  valor: string | null;
  onChange: (url: string | null) => void;
  onUpload: (file: File) => Promise<{ url: string | null; erro: string | null }>;
  formato?: "circulo" | "quadrado" | "retangular";
  tamanho?: "sm" | "md" | "lg";
  placeholder?: string;
  disabled?: boolean;
};

export function FileUpload({
  valor,
  onChange,
  onUpload,
  formato = "quadrado",
  tamanho = "md",
  placeholder = "Sem imagem",
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(valor);

  const tamanhos = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const formatoClasse = {
    circulo: "rounded-full",
    quadrado: "rounded-2xl",
    retangular: "rounded-lg",
  }[formato];

  async function handleFile(file: File) {
    setErro(null);
    setLoading(true);

    // Preview imediato
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    const { url, erro: err } = await onUpload(file);

    if (err || !url) {
      setErro(err ?? "Erro no upload");
      setPreview(valor);
      setLoading(false);
      return;
    }

    setPreview(url);
    onChange(url);
    setLoading(false);
  }

  async function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFile(file);
  }

  function remover() {
    setPreview(null);
    onChange(null);
    setErro(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex items-start gap-4">
      <div
        className={cn(
          "relative shrink-0 border-2 border-dashed border-border bg-primary-50/30 flex items-center justify-center overflow-hidden",
          tamanhos[tamanho],
          formatoClasse,
          loading && "opacity-60"
        )}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {loading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <Loader2 size={20} className="animate-spin text-primary" />
              </div>
            )}
          </>
        ) : (
          <ImageIcon size={24} className="text-slate-300" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface text-sm text-primary hover:bg-primary-50 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                A enviar...
              </>
            ) : (
              <>
                <Upload size={14} />
                {preview ? "Trocar" : "Escolher ficheiro"}
              </>
            )}
          </button>

          {preview && !loading && (
            <button
              type="button"
              onClick={remover}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-danger hover:bg-danger-50 transition-colors disabled:opacity-50"
            >
              <X size={14} />
              Remover
            </button>
          )}
        </div>

        <p className="text-xs text-slate-500 mt-2">
          {placeholder} · JPG, PNG, WEBP, ICO ou SVG
        </p>

        {erro && (
          <p className="text-xs text-danger mt-1">{erro}</p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/x-icon,image/svg+xml"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />
    </div>
  );
}
