"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadImages } from "@/services/images";

export function ImageUploadField({
  label = "صور المحصول",
  value,
  onChange,
  maxFiles = 5,
  folder = "crops",
}: {
  label?: string;
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  folder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function onFilesSelected(files: FileList | null) {
    if (!files?.length) return;
    const remaining = maxFiles - value.length;
    if (remaining <= 0) {
      setError(`الحد الأقصى ${maxFiles} صور`);
      return;
    }
    const batch = Array.from(files).slice(0, remaining);
    setUploading(true);
    setError("");
    try {
      const urls = await uploadImages(batch, folder);
      onChange([...value, ...urls]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل رفع الصورة");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((url, i) => (
            <li key={`${url}-${i}`} className="relative h-20 w-20 overflow-hidden rounded-lg border">
              <Image src={url} alt="" fill className="object-cover" sizes="80px" unoptimized />
              <button
                type="button"
                className="absolute top-0.5 end-0.5 rounded-full bg-black/60 p-0.5 text-white"
                onClick={() => removeAt(i)}
                aria-label="حذف الصورة"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {value.length < maxFiles && (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 px-4 py-6 text-sm font-medium text-emerald-800 hover:bg-emerald-50 disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
          {uploading ? "جاري الرفع..." : "إضافة أو رفع صور"}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => onFilesSelected(e.target.files)}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
