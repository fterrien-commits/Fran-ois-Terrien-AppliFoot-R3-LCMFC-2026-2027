import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Trash2, RefreshCw } from 'lucide-react';
import { processAndCompressImage } from '../utils/imageUtils';

interface ImageUploadDropzoneProps {
  id?: string;
  label?: string;
  sublabel?: string;
  currentImage?: string;
  onImageChange: (dataUrl: string) => void;
  onImageRemove?: () => void;
  maxWidth?: number;
  maxHeight?: number;
  shape?: 'square' | 'wide' | 'round';
  className?: string;
}

export const ImageUploadDropzone: React.FC<ImageUploadDropzoneProps> = ({
  id = 'image-upload',
  label = "Photo depuis l'ordinateur",
  sublabel = "Glissez-déposez une image ou cliquez pour parcourir (JPG, PNG, WebP)",
  currentImage,
  onImageChange,
  onImageRemove,
  maxWidth = 600,
  maxHeight = 600,
  shape = 'square',
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Le fichier sélectionné doit être une image (JPG, PNG, WebP).');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const dataUrl = await processAndCompressImage(file, {
        maxWidth,
        maxHeight,
        quality: 0.85,
      });
      onImageChange(dataUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors du traitement de l'image.";
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <span className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span>{label}</span>
          {isProcessing && (
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" /> Traitement...
            </span>
          )}
        </span>
      )}

      <input
        ref={fileInputRef}
        type="file"
        id={id}
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {currentImage ? (
        <div className="relative group bg-slate-950/80 border border-slate-700 hover:border-emerald-500/50 rounded-2xl p-2.5 flex items-center gap-3.5 transition-all">
          <div
            className={`relative overflow-hidden bg-slate-900 border border-slate-700 shrink-0 ${
              shape === 'wide'
                ? 'w-24 h-16 rounded-xl'
                : shape === 'round'
                ? 'w-16 h-16 rounded-full'
                : 'w-16 h-16 rounded-xl'
            }`}
          >
            <img
              src={currentImage}
              alt="Aperçu"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">Photo sélectionnée</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Prête à être enregistrée avec les données.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/20 transition-colors flex items-center gap-1"
              >
                <UploadCloud className="w-3 h-3" />
                Changer de photo
              </button>

              {onImageRemove && (
                <button
                  type="button"
                  onClick={onImageRemove}
                  className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-1 rounded-lg border border-rose-500/20 transition-colors flex items-center gap-1"
                  title="Supprimer cette photo"
                >
                  <Trash2 className="w-3 h-3" />
                  Retirer
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center transition-all ${
            isDragging
              ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
              : 'border-slate-700 hover:border-emerald-500/60 bg-slate-950/60 hover:bg-slate-900/60'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mb-2 group-hover:text-emerald-400 transition-colors">
            <UploadCloud className="w-5 h-5" />
          </div>

          <p className="text-xs font-bold text-slate-200">
            Glissez-déposez votre image ici
          </p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-xs">{sublabel}</p>
          <span className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
            <ImageIcon className="w-3.5 h-3.5" />
            Parcourir les fichiers
          </span>
        </div>
      )}

      {errorMessage && (
        <p className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2">
          {errorMessage}
        </p>
      )}
    </div>
  );
};
