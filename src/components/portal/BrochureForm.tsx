"use client";

import { useState } from "react";
import type { ProductBrochure } from "@/lib/types";
import {
  BATTERY_TYPE_OPTIONS,
  BRAKE_SYSTEM_OPTIONS,
  HEADLIGHT_OPTIONS,
  KEY_FEATURE_LABELS,
  SPEED_CATEGORY_OPTIONS,
  SPEEDOMETER_OPTIONS,
  TYRE_OPTIONS,
} from "@/lib/brochure";
import ImageUploadField from "./ImageUploadField";
import { Field, inputClass } from "./shared";

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[] | readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-semibold text-[#333]">{label}</label>
      <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => {
          if (typeof option === "string") {
            return (
              <option key={option} value={option}>
                {option}
              </option>
            );
          }
          return (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          );
        })}
      </select>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[#E6E6E6] bg-white px-3 py-3">
      <div>
        <p className="text-sm font-semibold text-[#111]">{label}</p>
        {hint && <p className="text-[11px] leading-tight text-[#888]">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-[#FF5A00]" : "bg-[#D4D4D8]"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

interface Props {
  brochure: ProductBrochure;
  onChange: (brochure: ProductBrochure) => void;
}

export default function BrochureForm({ brochure, onChange }: Props) {
  const [colorDraft, setColorDraft] = useState("");
  const [highlightDraft, setHighlightDraft] = useState("");
  const [socialDraft, setSocialDraft] = useState("");

  function patch(partial: Partial<ProductBrochure>) {
    onChange({ ...brochure, ...partial });
  }

  function addColor() {
    const next = colorDraft.trim();
    if (!next) return;
    if (brochure.colors.some((c) => c.toLowerCase() === next.toLowerCase())) {
      setColorDraft("");
      return;
    }
    patch({ colors: [...brochure.colors, next] });
    setColorDraft("");
  }

  function addHighlight() {
    const next = highlightDraft.trim();
    if (!next) return;
    if (brochure.highlightFeatures.some((f) => f.toLowerCase() === next.toLowerCase())) {
      setHighlightDraft("");
      return;
    }
    patch({ highlightFeatures: [...brochure.highlightFeatures, next] });
    setHighlightDraft("");
  }

  function addSocial() {
    const next = socialDraft.trim();
    if (!next) return;
    if (brochure.socialLinks.some((s) => s.toLowerCase() === next.toLowerCase())) {
      setSocialDraft("");
      return;
    }
    patch({ socialLinks: [...brochure.socialLinks, next] });
    setSocialDraft("");
  }

  return (
    <div className="mt-6 space-y-6 border-t border-[#F0F0F0] pt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#111]">Product Brochure</h3>
          <p className="mt-1 text-xs text-[#888]">
            Fill these fields to generate a Royal-style brochure PDF for this e-bike.
          </p>
        </div>
        <div className="w-full max-w-xs sm:w-auto">
          <ToggleRow
            label="Include in brochure PDF"
            checked={brochure.enabled}
            onChange={(enabled) => patch({ enabled })}
            hint="When on, Download PDF uses brochure layout"
          />
        </div>
      </div>

      <div className="rounded-xl border border-[#E6E6E6] bg-[#FAFAFA] p-4">
        <p className="mb-3 text-sm font-bold text-[#111]">Cover & overview</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            label="Brand name"
            value={brochure.brandName}
            placeholder="Tiger Rydo"
            onChange={(brandName) => patch({ brandName })}
          />
          <Field
            label="Cover tagline"
            value={brochure.coverTagline}
            placeholder="CLEAN ENERGY COMMUTING"
            onChange={(coverTagline) => patch({ coverTagline })}
          />
          <SelectField
            label="Speed category"
            value={brochure.speedCategory}
            options={SPEED_CATEGORY_OPTIONS}
            onChange={(speedCategory) =>
              patch({
                speedCategory: speedCategory as ProductBrochure["speedCategory"],
                speed:
                  SPEED_CATEGORY_OPTIONS.find((o) => o.value === speedCategory)?.label ||
                  brochure.speed,
              })
            }
          />
        </div>
        <ImageUploadField
          label="Logo image"
          value={brochure.logoUrl}
          folder="tiger-rydo/branding"
          hint="Optional. Shown in top corner on every brochure page."
          onChange={(logoUrl) => patch({ logoUrl })}
        />
        <Field
          label="Short description"
          rows={3}
          value={brochure.shortDescription}
          placeholder="A unique and potent model embodying brilliance, vitality, and attractiveness..."
          onChange={(shortDescription) => patch({ shortDescription })}
        />

        <div className="mb-2">
          <label className="mb-1.5 block text-sm font-semibold text-[#333]">Colors available</label>
          <div className="flex flex-wrap gap-2">
            <input
              className={inputClass + " max-w-[220px]"}
              value={colorDraft}
              placeholder="e.g. Metallic Grey"
              onChange={(e) => setColorDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addColor();
                }
              }}
            />
            <button
              type="button"
              onClick={addColor}
              className="rounded-lg border border-[#E6E6E6] bg-white px-3 py-2 text-sm font-semibold text-[#111] hover:border-[#FF5A00]/40"
            >
              Add color
            </button>
          </div>
          {brochure.colors.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {brochure.colors.map((color) => (
                <span
                  key={color}
                  className="inline-flex items-center gap-2 rounded-full border border-[#E6E6E6] bg-white px-3 py-1 text-xs font-medium text-[#333]"
                >
                  {color}
                  <button
                    type="button"
                    className="text-[#999] hover:text-red-500"
                    onClick={() =>
                      patch({ colors: brochure.colors.filter((c) => c !== color) })
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[#E6E6E6] bg-[#FAFAFA] p-4">
        <p className="mb-3 text-sm font-bold text-[#111]">Company details (final page)</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            label="Mission"
            rows={2}
            value={brochure.mission}
            onChange={(mission) => patch({ mission })}
          />
          <Field
            label="Company description"
            rows={2}
            value={brochure.companyDescription}
            onChange={(companyDescription) => patch({ companyDescription })}
          />
          <Field
            label="Address"
            rows={2}
            value={brochure.address}
            onChange={(address) => patch({ address })}
          />
          <Field label="Phone" value={brochure.phone} onChange={(phone) => patch({ phone })} />
          <Field label="Email" value={brochure.email} onChange={(email) => patch({ email })} />
          <Field
            label="Website"
            value={brochure.website}
            onChange={(website) => patch({ website })}
          />
        </div>
        <ImageUploadField
          label="QR image"
          value={brochure.qrCodeUrl}
          folder="tiger-rydo/branding/qr"
          hint="Optional. Upload a QR code image for website/lead form."
          onChange={(qrCodeUrl) => patch({ qrCodeUrl })}
        />
        <div className="mt-3">
          <label className="mb-1.5 block text-sm font-semibold text-[#333]">Social links</label>
          <div className="flex flex-wrap gap-2">
            <input
              className={inputClass + " max-w-[360px]"}
              value={socialDraft}
              placeholder="e.g. instagram.com/tigerrydo"
              onChange={(e) => setSocialDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSocial();
                }
              }}
            />
            <button
              type="button"
              onClick={addSocial}
              className="rounded-lg border border-[#E6E6E6] bg-white px-3 py-2 text-sm font-semibold text-[#111] hover:border-[#FF5A00]/40"
            >
              Add social
            </button>
          </div>
          {brochure.socialLinks.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {brochure.socialLinks.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-2 rounded-full border border-[#E6E6E6] bg-white px-3 py-1 text-xs font-medium text-[#333]"
                >
                  {s}
                  <button
                    type="button"
                    className="text-[#999] hover:text-red-500"
                    onClick={() =>
                      patch({ socialLinks: brochure.socialLinks.filter((x) => x !== s) })
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[#E6E6E6] bg-[#FAFAFA] p-4">
        <p className="mb-3 text-sm font-bold text-[#111]">Gallery images</p>
        <p className="mb-3 text-xs text-[#888]">
          Upload extra product photos for the brochure pages (main product image is still used as cover).
        </p>
        <ImageUploadField
          label="Add gallery images"
          value=""
          multiple
          folder="tiger-rydo/products/gallery"
          onChange={() => undefined}
          onBatchUpload={(urls) =>
            patch({
              galleryImages: [
                ...brochure.galleryImages,
                ...urls.map((url) => ({ url, caption: "" })),
              ],
            })
          }
        />
        {brochure.galleryImages.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {brochure.galleryImages.map((item, idx) => (
              <div
                key={`${item.url}-${idx}`}
                className="relative overflow-hidden rounded-lg border border-[#E6E6E6] bg-white p-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt="Gallery" className="h-24 w-full object-contain" />
                <input
                  className={inputClass + " mt-2 py-1.5 text-xs"}
                  placeholder="Caption for this image"
                  value={item.caption}
                  onChange={(e) =>
                    patch({
                      galleryImages: brochure.galleryImages.map((g, gIdx) =>
                        gIdx === idx ? { ...g, caption: e.target.value } : g
                      ),
                    })
                  }
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 rounded bg-black/70 px-2 py-0.5 text-[10px] text-white"
                  onClick={() =>
                    patch({
                      galleryImages: brochure.galleryImages.filter((_, gIdx) => gIdx !== idx),
                    })
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[#E6E6E6] bg-[#FAFAFA] p-4">
        <p className="mb-3 text-sm font-bold text-[#111]">Motor / Speed / Chassis</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Motor" value={brochure.motor} onChange={(motor) => patch({ motor })} />
          <Field label="Speed" value={brochure.speed} onChange={(speed) => patch({ speed })} />
          <Field
            label="Chassis"
            value={brochure.chassis}
            onChange={(chassis) => patch({ chassis })}
          />
          <Field
            label="Suspension"
            value={brochure.suspension}
            onChange={(suspension) => patch({ suspension })}
          />
        </div>
        <Field
          label="Other feature"
          value={brochure.otherFeature}
          onChange={(otherFeature) => patch({ otherFeature })}
        />
      </div>

      <div className="rounded-xl border border-[#E6E6E6] bg-[#FAFAFA] p-4">
        <p className="mb-3 text-sm font-bold text-[#111]">Key features</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {KEY_FEATURE_LABELS.map(({ key, label }) => (
            <ToggleRow
              key={key}
              label={label}
              checked={brochure.keyFeatures[key]}
              onChange={(checked) =>
                patch({
                  keyFeatures: { ...brochure.keyFeatures, [key]: checked },
                })
              }
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#E6E6E6] bg-[#FAFAFA] p-4">
        <p className="mb-3 text-sm font-bold text-[#111]">Brake / Tyre / Weight</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField
            label="Brake system"
            value={brochure.brakeSystem}
            options={BRAKE_SYSTEM_OPTIONS}
            onChange={(brakeSystem) => patch({ brakeSystem })}
          />
          <SelectField
            label="Tyre"
            value={brochure.tyre}
            options={TYRE_OPTIONS}
            onChange={(tyre) => patch({ tyre })}
          />
          <Field
            label="Tyre size front"
            value={brochure.tyreSizeFront}
            placeholder='10"'
            onChange={(tyreSizeFront) => patch({ tyreSizeFront })}
          />
          <Field
            label="Tyre size rear"
            value={brochure.tyreSizeRear}
            placeholder='10"'
            onChange={(tyreSizeRear) => patch({ tyreSizeRear })}
          />
          <Field
            label="Weight"
            value={brochure.weight}
            placeholder="100 Kg"
            onChange={(weight) => patch({ weight })}
          />
          <SelectField
            label="Speedometer"
            value={brochure.speedometer}
            options={SPEEDOMETER_OPTIONS}
            onChange={(speedometer) => patch({ speedometer })}
          />
        </div>
      </div>

      <div className="rounded-xl border border-[#E6E6E6] bg-[#FAFAFA] p-4">
        <p className="mb-3 text-sm font-bold text-[#111]">Battery & lighting</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField
            label="Battery"
            value={brochure.battery}
            options={BATTERY_TYPE_OPTIONS}
            onChange={(battery) => patch({ battery })}
          />
          <SelectField
            label="Head light"
            value={brochure.headLight}
            options={HEADLIGHT_OPTIONS}
            onChange={(headLight) => patch({ headLight })}
          />
          <Field
            label="Charger"
            value={brochure.charger}
            onChange={(charger) => patch({ charger })}
          />
          <Field
            label="Charging time (Lithium)"
            value={brochure.chargingTimeLithium}
            placeholder="3-5 hrs"
            onChange={(chargingTimeLithium) => patch({ chargingTimeLithium })}
          />
          <Field
            label="Charging time (Lead Acid)"
            value={brochure.chargingTimeLeadAcid}
            placeholder="6-8 hrs"
            onChange={(chargingTimeLeadAcid) => patch({ chargingTimeLeadAcid })}
          />
        </div>
      </div>

      <div className="rounded-xl border border-[#E6E6E6] bg-[#FAFAFA] p-4">
        <p className="mb-3 text-sm font-bold text-[#111]">Highlight feature chips</p>
        <p className="mb-3 text-xs text-[#888]">
          Shown as feature icons/labels on the brochure (Efficient Batteries, Quick Charge, etc.).
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          <input
            className={inputClass + " max-w-[260px]"}
            value={highlightDraft}
            placeholder="e.g. Hydraulic Suspension"
            onChange={(e) => setHighlightDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addHighlight();
              }
            }}
          />
          <button
            type="button"
            onClick={addHighlight}
            className="rounded-lg border border-[#E6E6E6] bg-white px-3 py-2 text-sm font-semibold text-[#111] hover:border-[#FF5A00]/40"
          >
            Add highlight
          </button>
        </div>
        {brochure.highlightFeatures.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {brochure.highlightFeatures.map((feature) => (
              <span
                key={feature}
                className="inline-flex items-center gap-2 rounded-full border border-[#FF5A00]/25 bg-[#FFF0E6] px-3 py-1 text-xs font-medium text-[#FF5A00]"
              >
                {feature}
                <button
                  type="button"
                  className="text-[#FF5A00]/70 hover:text-red-500"
                  onClick={() =>
                    patch({
                      highlightFeatures: brochure.highlightFeatures.filter((f) => f !== feature),
                    })
                  }
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
