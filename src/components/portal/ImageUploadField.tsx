"use client";

import { useRef, useState } from "react";
import { inputClass } from "./shared";

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  hint?: string;
}

export default function ImageUploadField({
  label,
  value,
  onChange,
  folder = "tiger-rydo",
  hint,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileSelect(file: File | null) {
    if (!file) return;

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-semibold text-[#333]">{label}</label>
      {hint && <p className="mb-1.5 text-xs text-[#888]">{hint}</p>}

      {value && (
        <div className="mb-3 overflow-hidden rounded-lg border border-[#E6E6E6] bg-[#FAFAFA] p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={`${label} preview`}
            className="mx-auto max-h-40 object-contain"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg border border-[#E6E6E6] bg-white px-4 py-2.5 text-sm font-semibold text-[#111] transition hover:border-[#FF5A00]/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? "Uploading..." : value ? "Replace image" : "Upload image"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            disabled={uploading}
            className="rounded-lg border border-[#E6E6E6] px-4 py-2.5 text-sm text-[#666] transition hover:border-red-300 hover:text-red-600 disabled:opacity-60"
          >
            Remove
          </button>
        )}
      </div>

      <input
        type="url"
        className={`${inputClass} mt-3`}
        value={value}
        placeholder="Image URL (filled automatically after upload)"
        onChange={(e) => onChange(e.target.value)}
      />

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
