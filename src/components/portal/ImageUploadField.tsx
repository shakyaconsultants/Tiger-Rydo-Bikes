"use client";

import { useRef, useState } from "react";
import { inputClass } from "./shared";

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onBatchUpload?: (urls: string[]) => void;
  folder?: string;
  hint?: string;
  multiple?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export default function ImageUploadField({
  label,
  value,
  onChange,
  onBatchUpload,
  folder = "tiger-rydo",
  hint,
  multiple = false,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileSelect(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    for (const file of files) {
      if (!ACCEPTED_MIME_TYPES.has(file.type)) {
        setError(`Unsupported format for "${file.name}". Use JPEG, PNG, WebP, or GIF`);
        if (inputRef.current) {
          inputRef.current.value = "";
        }
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`Image "${file.name}" must be 5 MB or smaller`);
        if (inputRef.current) {
          inputRef.current.value = "";
        }
        return;
      }
    }

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });
      // Keep this for backward compatibility with existing server expectations.
      formData.append("file", files[0]);
      formData.append("folder", folder);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        url?: string;
        urls?: string[];
      };

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      const uploadedUrls =
        Array.isArray(data.urls) && data.urls.length > 0
          ? data.urls
          : data.url
            ? [data.url]
            : [];

      if (uploadedUrls.length === 0) {
        throw new Error("Upload failed: missing image URL");
      }

      if (onBatchUpload) {
        onBatchUpload(uploadedUrls);
      }

      onChange(uploadedUrls[0]);
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
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg border border-[#E6E6E6] bg-white px-4 py-2.5 text-sm font-semibold text-[#111] transition hover:border-[#FF5A00]/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading
            ? "Uploading..."
            : multiple
              ? "Upload images"
              : value
                ? "Replace image"
                : "Upload image"}
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

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
