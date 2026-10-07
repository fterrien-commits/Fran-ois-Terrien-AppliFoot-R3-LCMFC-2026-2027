import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Plus, Trash2, Maximize2, X, UploadCloud, RefreshCw } from 'lucide-react';
import { processAndCompressImage } from '../utils/imageUtils';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface MatchPhotosManagerProps {
  photos: string[];
  onChange: (newPhotos: string[]) => void;
  maxPhotos?: number;
  readOnly?: boolean;
}

export const MatchPhotosManager: React.FC<MatchPhotosManagerProps> = ({
  photos = [],
  onChange,
  maxPhotos = 2,
  readOnly = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [photoToDeleteIndex, setPhotoToDeleteIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleProcessFile = async (file: File, slotIndex?: number) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Le fichier doit être une image (JPG, PNG, WebP).');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const dataUrl = await processAndCompressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.85,
      });

      const updated = [...photos];
      if (slotIndex !== undefined && slotIndex < updated.length) {
        // Replace existing photo in slot
        updated[slotIndex] = dataUrl;
      } else if (updated.length < maxPhotos) {
        // Append photo
        updated.push(dataUrl);
      }
      onChange(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de traitement de l'image.";
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
      setActiveSlotIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, slotIndex: number) => {
    e.preventDefault();
    setDragOverSlot(null);
    if (readOnly) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0], slotIndex);
    }
  };

  const handleRemovePhoto = (index: number) => {
    if (readOnly) return;
    const updated = photos.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  const triggerUploadForSlot = (slotIndex: number) => {
    if (readOnly) return;
    setActiveSlotIndex(slotIndex);
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const targetSlot = activeSlotIndex !== null ? activeSlotIndex : photos.length;
      handleProcessFile(e.target.files[0], targetSlot);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Camera className="w-4 h-4 text-emerald-400" />
          <span>Photos du Match ({photos.length}/{maxPhotos})</span>
        </label>
        <span className="text-[11px] text-slate-400">
          Photos d'équipe, causerie ou action (max 2)
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {errorMessage && (
        <p className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2">
          {errorMessage}
        </p>
      )}

      {/* Grid of 2 slots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: maxPhotos }).map((_, slotIdx) => {
          const photoUrl = photos[slotIdx];
          const isSlotOccupied = !!photoUrl;
          const isDraggingHere = dragOverSlot === slotIdx;

          if (isSlotOccupied) {
            return (
              <div
                key={slotIdx}
                className="relative group rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 aspect-video shadow-lg"
              >
                <img
                  src={photoUrl}
                  alt={`Photo ${slotIdx + 1} du match`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />

                <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 rounded-lg border border-slate-700">
                  Photo {slotIdx + 1}
                </div>

                {/* Overlay actions */}
                <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(slotIdx)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors shadow"
                    title="Agrandir la photo"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>

                  {!readOnly && (
                    <>
                      <button
                        type="button"
                        onClick={() => triggerUploadForSlot(slotIdx)}
                        className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors shadow"
                        title="Remplacer la photo depuis l'ordinateur"
                      >
                        <UploadCloud className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotoToDeleteIndex(slotIdx)}
                        className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors shadow"
                        title="Supprimer la photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          }

          if (readOnly) {
            return (
              <div
                key={slotIdx}
                className="border border-dashed border-slate-800 rounded-2xl aspect-video flex flex-col items-center justify-center text-slate-500 text-xs bg-slate-950/30"
              >
                <ImageIcon className="w-6 h-6 mb-1 opacity-40" />
                <span>Emplacement {slotIdx + 1} vide</span>
              </div>
            );
          }

          return (
            <div
              key={slotIdx}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverSlot(slotIdx);
              }}
              onDragLeave={() => setDragOverSlot(null)}
              onDrop={(e) => handleDrop(e, slotIdx)}
              onClick={() => triggerUploadForSlot(slotIdx)}
              className={`cursor-pointer border-2 border-dashed rounded-2xl aspect-video flex flex-col items-center justify-center p-4 text-center transition-all ${
                isDraggingHere
                  ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
                  : 'border-slate-800 hover:border-emerald-500/60 bg-slate-950/50 hover:bg-slate-900/50'
              }`}
            >
              {isProcessing && activeSlotIndex === slotIdx ? (
                <div className="flex flex-col items-center gap-2 text-emerald-400">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span className="text-xs font-semibold">Compression en cours...</span>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mb-2 group-hover:text-emerald-400">
                    <Plus className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-300">
                    Ajouter la photo {slotIdx + 1}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Glissez-déposez ou cliquez
                  </p>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={photos[lightboxIndex]}
              alt={`Photo ${lightboxIndex + 1}`}
              className="max-w-full max-h-[80vh] rounded-2xl object-contain border border-slate-700 shadow-2xl"
              referrerPolicy="no-referrer"
            />
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs font-bold text-slate-300">
                Photo {lightboxIndex + 1} sur {photos.length}
              </span>
              {photos.length > 1 && (
                <button
                  onClick={() => setLightboxIndex(lightboxIndex === 0 ? 1 : 0)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 underline font-semibold"
                >
                  Voir l'autre photo
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Photo Deletion */}
      <ConfirmDeleteModal
        isOpen={photoToDeleteIndex !== null}
        title="Supprimer la photo du match"
        message="Êtes-vous sûr de vouloir effacer cette photo du match ? Cette action est irréversible."
        confirmText="Effacer la photo"
        onConfirm={() => {
          if (photoToDeleteIndex !== null) {
            handleRemovePhoto(photoToDeleteIndex);
            setPhotoToDeleteIndex(null);
          }
        }}
        onClose={() => setPhotoToDeleteIndex(null)}
      />
    </div>
  );
};
