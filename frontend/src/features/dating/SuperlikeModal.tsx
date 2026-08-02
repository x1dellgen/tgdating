import { useState } from 'react';

interface SuperlikeModalProps {
  profileName: string;
  onSend: (message: string) => void;
  onCancel: () => void;
}

/** Модалка отправки суперлайка с необязательным текстовым сообщением */
export function SuperlikeModal({ profileName, onSend, onCancel }: SuperlikeModalProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    onSend(message.trim());
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-[380px] rounded-3xl bg-slate-900 border border-white/10 shadow-2xl animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400/20 to-amber-500/10 border border-yellow-500/30 mx-auto mb-3 flex items-center justify-center">
            <span className="text-3xl">⭐</span>
          </div>
          <h3 className="text-lg font-bold text-white">Суперлайк для {profileName}</h3>
          <p className="text-slate-400 text-xs mt-1">
            Выделите своё сообщение среди обычных лайков
          </p>
        </div>

        {/* Textarea */}
        <div className="px-5 pb-2">
          <textarea
            value={message}
            onChange={(e) => {
              if (e.target.value.length <= 200) setMessage(e.target.value);
            }}
            placeholder="Добавьте записку к суперлайку (необязательно)"
            rows={3}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-yellow-500/60 transition-colors resize-none"
          />
          <p className="text-[11px] text-slate-500 text-right mt-1">{message.length}/200</p>
        </div>

        {/* Buttons */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 active:scale-95 transition-all text-sm font-semibold"
          >
            Отмена
          </button>
          <button
            onClick={handleSend}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-semibold text-sm hover:from-yellow-400 hover:to-amber-400 active:scale-95 transition-all shadow-lg shadow-yellow-500/20"
          >
            ⭐ Отправить
          </button>
        </div>
      </div>
    </div>
  );
}