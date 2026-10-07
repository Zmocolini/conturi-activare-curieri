"use client";

import React, { useRef, useState } from "react";
import { Camera, CheckCircle2, X, Eye, RefreshCw, FileText, Upload } from "lucide-react";

interface ImageUploadFieldProps {
  id: string;
  label: string;
  description: string;
  value: string;
  onChange: (base64OrUrl: string) => void;
  required?: boolean;
  exampleHint?: string;
  badge?: string;
}

// Compress image on client side using canvas to avoid giant phone camera uploads
async function processFile(file: File): Promise<string> {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  // If PDF, directly read as data URL without canvas
  if (isPdf) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // If image, compress via canvas
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1920;
        const maxHeight = 1920;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Compress as JPEG 0.85
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => {
        // Fallback to raw data url if image element fails
        resolve(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ImageUploadField({
  id,
  label,
  description,
  value,
  onChange,
  required = false,
  exampleHint,
  badge,
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const isPdf =
    value.startsWith("data:application/pdf") ||
    value.toLowerCase().includes(".pdf");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const dataUrl = await processFile(file);
      onChange(dataUrl);
    } catch (err) {
      console.error("Error processing file:", err);
      alert("A apărut o problemă la încărcarea fișierului. Te rugăm să încerci din nou.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          {label}
          {required && <span className="text-rose-500 font-bold">*</span>}
          {badge && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800">
              {badge}
            </span>
          )}
        </label>
      </div>

      <p className="text-xs text-slate-500">{description}</p>

      {/* Hidden file input supporting images AND PDF */}
      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept="image/*,application/pdf,.pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {!value ? (
        <div
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 bg-white hover:bg-slate-50 border-slate-300 hover:border-amber-400 group relative ${
            isProcessing ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center py-4">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-2" />
              <span className="text-sm font-medium text-slate-600">Se procesează documentul...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center text-amber-600 transition-colors">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 group-hover:text-amber-600 transition-colors">
                  Apasă pentru a alege fișierul (Poză sau PDF)
                </p>
                <p className="text-xs text-slate-400 mt-1">Acceptă format PDF, JPG, PNG, WEBP</p>
              </div>
              {exampleHint && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs mt-1">
                  💡 {exampleHint}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="relative rounded-2xl border border-emerald-200 bg-emerald-50/40 p-3 overflow-hidden">
          <div className="flex items-center gap-4">
            {/* Thumbnail Preview: PDF or Image */}
            <div
              onClick={() => setShowPreviewModal(true)}
              className="relative w-20 h-20 rounded-xl overflow-hidden cursor-pointer group bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center"
            >
              {isPdf ? (
                <div className="flex flex-col items-center justify-center text-rose-600 w-full h-full bg-rose-50 p-1 text-center">
                  <FileText className="w-8 h-8 text-rose-500 mb-0.5" />
                  <span className="text-[10px] font-bold">PDF</span>
                </div>
              ) : (
                <img
                  src={value}
                  alt={label}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Eye className="w-5 h-5" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold mb-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{isPdf ? "Document PDF încărcat" : "Poză încărcată cu succes"}</span>
              </div>
              <p className="text-xs text-slate-500 truncate">
                {isPdf ? "Fișier PDF pregătit pentru salvare" : "Imagine optimizată și pregătită"}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="text-xs font-medium text-slate-700 hover:text-slate-900 underline flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> {isPdf ? "Vizualizează PDF" : "Vezi poza"}
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-medium text-amber-600 hover:text-amber-700 underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Înlocuiește
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
              title="Șterge fișierul"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal preview (Image or PDF) */}
      {showPreviewModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                {isPdf && <FileText className="w-4 h-4 text-rose-500" />}
                <span>{label}</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 flex-1 overflow-auto flex items-center justify-center">
              {isPdf ? (
                <iframe
                  src={value}
                  className="w-full h-[70vh] bg-white rounded-lg border-0"
                  title={label}
                />
              ) : (
                <img
                  src={value}
                  alt={label}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              )}
            </div>

            <div className="p-3 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowPreviewModal(false);
                  fileInputRef.current?.click();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
              >
                Înlocuiește fișierul
              </button>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800"
              >
                Închide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
