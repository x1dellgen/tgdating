import { useMatch } from '../../context/MatchContext';
import { useChat } from '../../context/ChatContext';

export function MatchOverlay() {
  const { activeMatchProfile, dismissMatch, onNavigateToChats } = useMatch();
  const { openChat } = useChat();

  if (!activeMatchProfile) return null;

  const handleWriteMessage = () => {
    openChat(activeMatchProfile);
    dismissMatch();
    onNavigateToChats?.();
  };

  const handleContinueSearch = () => {
    dismissMatch();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-pink-500/30 rounded-3xl px-8 py-10 max-w-sm w-[90%] text-center shadow-2xl shadow-pink-500/10">
        {/* Иконка мэтча */}
        <div className="text-6xl mb-4">💘</div>

        <h2 className="text-2xl font-bold text-white mb-2">
          У вас взаимная симпатия с {activeMatchProfile.name}!
        </h2>

        {/* Фото и имя */}
        <div className="flex items-center justify-center gap-3 mt-4 mb-1">
          <img
            src={activeMatchProfile.photos[0]}
            alt={activeMatchProfile.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-pink-500/50"
          />
          <div className="text-left">
            <p className="text-white font-semibold text-lg">
              {activeMatchProfile.name}, {activeMatchProfile.age}
            </p>
            <p className="text-slate-400 text-sm">{activeMatchProfile.city}</p>
          </div>
        </div>

        <p className="text-slate-400 text-sm mt-4 mb-6">
          Не упустите возможность! Начните общение прямо сейчас.
        </p>

        {/* Кнопки */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleWriteMessage}
            className="w-full py-3 rounded-xl bg-pink-500 hover:bg-pink-600 active:scale-[0.98] transition-all text-white font-semibold text-sm"
          >
            Написать сообщение
          </button>
          <button
            onClick={handleContinueSearch}
            className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-[0.98] transition-all text-slate-300 text-sm"
          >
            Продолжить поиск
          </button>
        </div>
      </div>
    </div>
  );
}