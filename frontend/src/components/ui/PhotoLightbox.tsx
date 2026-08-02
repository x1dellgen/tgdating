import { useState, useCallback, useEffect } from 'react';

interface PhotoLightboxProps {
  photos: string[];
  initialIndex?: number;
  onClose: () => void;
}

/** Полноэкранный просмотрщик фотографий с навигацией */
export function PhotoLightbox({ photos, initialIndex = 0, onClose }: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? photos.length - 1 : prev - 1));
  }, [photos.length]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev >= photos.length - 1 ? 0 : prev + 1));
  }, [photos.length]);

  // Закрытие по Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goPrev, goNext]);

  // Блокируем скролл body
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      {/* Кнопка закрытия */}
      <button
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); onClose(); }}
        className="absolute top-4 right-4 z-[110] w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-lg hover:bg-white/20 transition-all active:scale-90"
        aria-label="Закрыть"
      >
        ✕
      </button>

      {/* Индикатор позиции */}
      {photos.length > 1 && (
        <div className="absolute top-5 left-0 right-0 flex justify-center z-[101]">
          <span className="text-white/60 text-sm font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
            {currentIndex + 1} / {photos.length}
          </span>
        </div>
      )}

      {/* Фото */}
      <div
        className="flex-1 flex items-center justify-center w-full px-4 py-16 min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photos[currentIndex]}
          alt={`Фото ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain select-none"
          draggable={false}
        />
      </div>

      {/* Навигация */}
      {photos.length > 1 && (
        <div className="absolute inset-y-0 left-0 w-1/3 z-[101]" onClick={(e) => { e.stopPropagation(); goPrev(); }} />
      )}
      {photos.length > 1 && (
        <div className="absolute inset-y-0 right-0 w-1/3 z-[101]" onClick={(e) => { e.stopPropagation(); goNext(); }} />
      )}

      {/* Миниатюры внизу */}
      {photos.length > 1 && (
        <div
          className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-[101] px-4"
          onClick={(e) => e.stopPropagation()}
        >
          {photos.map((photo, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all active:scale-95 ${
                i === currentIndex ? 'border-white/80 scale-110' : 'border-white/20 opacity-60'
              }`}
            >
              <img src={photo} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}