import { useState } from 'react';

export const REPORT_REASONS = [
  { id: 'spam', label: 'Спам / Реклама', emoji: '🚫' },
  { id: 'abuse', label: 'Оскорбления / Неадекватность', emoji: '🤬' },
  { id: 'fake', label: 'Фейковый аккаунт', emoji: '👤' },
  { id: 'other', label: 'Другое', emoji: '⚠️' },
] as const;

export type ReportReasonId = (typeof REPORT_REASONS)[number]['id'];

interface ReportModalProps {
  profileName: string;
  onConfirm: (reason: ReportReasonId) => void;
  onClose: () => void;
}

export function ReportModal({ profileName, onConfirm, onClose }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReasonId | null>(null);

  const handleConfirm = () => {
    if (!selectedReason) return;
    onConfirm(selectedReason);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[400px] rounded-3xl bg-slate-900 border border-white/10 shadow-2xl animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-lg font-bold text-white text-center">Пожаловаться и заблокировать</h3>
          <p className="text-slate-400 text-sm text-center mt-1">
            Выберите причину жалобы на {profileName}
          </p>
        </div>

        {/* Reasons */}
        <div className="px-5 pb-4 space-y-2">
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason.id}
              onClick={() => setSelectedReason(reason.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                selectedReason === reason.id
                  ? 'bg-red-500/15 border-red-500/40 text-white'
                  : 'bg-white/5 border-white/8 text-slate-300 hover:border-white/15'
              }`}
            >
              <span className="text-lg">{reason.emoji}</span>
              <span className="text-sm font-medium">{reason.label}</span>
              {/* Radio indicator */}
              <div className="ml-auto">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedReason === reason.id
                      ? 'border-red-500 bg-red-500'
                      : 'border-slate-600'
                  }`}
                >
                  {selectedReason === reason.id && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Buttons */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/8 text-slate-300 hover:bg-white/10 active:scale-95 transition-all text-sm font-semibold"
          >
            Отмена
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedReason}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all text-sm font-semibold"
          >
            Заблокировать
          </button>
        </div>
      </div>
    </div>
  );
}