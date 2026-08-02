import { useRef, useCallback } from 'react';
import { useRegistration } from '../../context/RegistrationContext';

const MAX_PHOTOS = 6;
const MIN_PHOTOS = 3;
/** Максимальный размер фото: 15 МБ */
const MAX_FILE_SIZE = 15 * 1024 * 1024;

export function StepPhotos() {
  const { form, updateField } = useRegistration();
  const { photos } = form;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Реф для безопасной аккумуляции Base64 при множественном выборе файлов
  const pendingRef = useRef<string[]>([]);
  const pendingCountRef = useRef(0);

  const handleAddPhotoClick = () => {
    if (photos.length >= MAX_PHOTOS) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const currentPhotos = photos;
      const remainingSlots = MAX_PHOTOS - currentPhotos.length;
      const filesToAdd = Array.from(files).slice(0, remainingSlots);

      if (filesToAdd.length === 0) {
        e.target.value = '';
        return;
      }

      // Инициализируем аккумулятор
      pendingRef.current = [];
      pendingCountRef.current = filesToAdd.length;

      // Валидация типов и размеров
      const validFiles = filesToAdd.filter((file) => {
        if (!file.type.startsWith('image/')) return false;
        if (file.size > MAX_FILE_SIZE) return false;
        return true;
      });

      if (validFiles.length === 0) {
        e.target.value = '';
        return;
      }

      // Пересчитываем аккумулятор на валидные файлы
      pendingRef.current = [];
      pendingCountRef.current = validFiles.length;

      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            pendingRef.current.push(reader.result);
          }
          pendingCountRef.current--;

          // Когда все файлы прочитаны — атомарно обновляем стейт
          if (pendingCountRef.current <= 0) {
            updateField('photos', [...currentPhotos, ...pendingRef.current]);
          }
        };
        reader.readAsDataURL(file);
      });

      // Сброс input, чтобы можно было выбрать тот же файл повторно
      e.target.value = '';
    },
    [photos, updateField],
  );

  const handleRemovePhoto = (index: number) => {
    updateField('photos', photos.filter((_, i) => i !== index));
  };

  const isValid = photos.length >= MIN_PHOTOS && photos.length <= MAX_PHOTOS;

  return (
    <div className="flex flex-col gap-6">
      {/* Скрытый нативный input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="text-center">
        <p className="text-sm text-slate-400">
          Загрузи от {MIN_PHOTOS} до {MAX_PHOTOS} фото
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {photos.length} из {MAX_PHOTOS}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: MAX_PHOTOS }).map((_, i) => {
          if (i < photos.length) {
            return (
              <div
                key={i}
                className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 border border-slate-700 group"
              >
                <img
                  src={photos[i]}
                  alt={`Фото ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/80 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            );
          }
          return (
            <button
              key={i}
              type="button"
              onClick={handleAddPhotoClick}
              className="aspect-[3/4] rounded-xl bg-slate-800 border-2 border-dashed border-slate-600 hover:border-slate-500 flex items-center justify-center transition-colors"
            >
              <span className="text-3xl text-slate-500">+</span>
            </button>
          );
        })}
      </div>

      {!isValid && photos.length > 0 && (
        <p className="text-xs text-amber-400 text-center">
          Нужно минимум {MIN_PHOTOS} фото
        </p>
      )}
    </div>
  );
}