import { useState } from 'react';
import { useMatch } from '../../context/MatchContext';
import { useChat } from '../../context/ChatContext';
import { useRegistration } from '../../context/RegistrationContext';
import { mockProfiles } from '../swipes/mockProfiles';
import { SUPERLIKE_DEMO_PROFILE, SUPERLIKE_DEMO_MESSAGE } from './LikesTab';

const STORAGE_KEY = 'dateme_user_profile';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminPanelModal({ isOpen, onClose }: AdminPanelModalProps) {
  const { triggerMatch } = useMatch();
  const { threads, activeThreadId, openChat, sendMessage } = useChat();
  const { form, resetForm } = useRegistration();
  const [lastAction, setLastAction] = useState<string | null>(null);

  // Проверяем, есть ли профиль в localStorage
  const hasProfile = !!localStorage.getItem(STORAGE_KEY);

  if (!isOpen) return null;

  const handleClearStorage = () => {
    if (!confirm('⚠️ Это очистит все данные и перезагрузит страницу. Продолжить?')) return;
    resetForm();
    localStorage.clear();
    setLastAction('LocalStorage очищен. Перезагрузка...');
    setTimeout(() => window.location.reload(), 600);
  };

  const handleGenerateMatch = () => {
    // Берём случайный профиль из моков
    const randomIndex = Math.floor(Math.random() * mockProfiles.length);
    const randomProfile = mockProfiles[randomIndex];
    triggerMatch(randomProfile);
    setLastAction(`Мэтч создан: ${randomProfile.name}, ${randomProfile.age}`);
  };

  const handleGenerateSuperlikeWithMessage = () => {
    // Диспатчим кастомное событие, чтобы LikesTab поймал его и добавил карточку
    window.dispatchEvent(
      new CustomEvent('datesphere:addSuperlikeDemo', {
        detail: { profile: SUPERLIKE_DEMO_PROFILE, message: SUPERLIKE_DEMO_MESSAGE },
      }),
    );
    setLastAction(`⭐ Суперлайк с сообщением от ${SUPERLIKE_DEMO_PROFILE.name} добавлен в Лайки`);
  };

  const handleSimulateMessage = () => {
    if (!activeThreadId) {
      // Если нет активного чата, открываем первый попавшийся
      const targetProfile = threads.length > 0
        ? threads[0].profile
        : mockProfiles[0];
      openChat(targetProfile);
      // Даём время на создание чата, потом отправляем
      setTimeout(() => {
        sendMessage('🧪 Тестовое сообщение из Dev Tools');
      }, 100);
      setLastAction(`Открыто тестовое сообщение в чате ${targetProfile.name}`);
      return;
    }
    sendMessage('🧪 Тестовое сообщение из Dev Tools');
    setLastAction('Тестовое сообщение отправлено в активный чат');
  };

  const handleToggleProfile = () => {
    if (hasProfile) {
      // Удаляем профиль — сбрасываем форму
      resetForm();
      localStorage.removeItem(STORAGE_KEY);
      setLastAction('hasProfile → false (профиль удалён)');
    } else {
      // Создаём заглушку профиля
      const stubProfile = {
        photos: [],
        name: 'TestUser',
        birthDate: '2000-06-15',
        city: 'Москва',
        bio: 'Тестовый профиль для отладки',
        interests: ['Музыка', 'Кино'],
        relationshipGoals: ['Общение'],
        searchingFor: {
          gender: 'all' as const,
          ageRange: [18, 29] as [number, number],
          city: '',
          searchEverywhere: false,
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stubProfile));
      setLastAction('hasProfile → true (заглушка создана). Перезагрузите страницу.');
    }
  };

  return (
    <>
      {/* Затемнённый фон */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Модалка */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Заголовок */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-lg">🛠️</span>
              <h2 className="text-base font-bold text-white">Dev Tools</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
              aria-label="Закрыть"
            >
              ✕
            </button>
          </div>

          {/* Содержимое */}
          <div className="px-5 py-4 flex flex-col gap-3">
            {/* 1. Сбросить всё */}
            <button
              onClick={handleClearStorage}
              className="w-full py-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25 active:scale-[0.98] transition-all text-sm font-semibold text-left px-4 flex items-center gap-3"
            >
              <span className="text-lg">🗑️</span>
              <div>
                <div>Сбросить всё</div>
                <div className="text-xs text-red-400/60 font-normal">Clear LocalStorage</div>
              </div>
            </button>

            {/* 2. Сгенерировать мэтч */}
            <button
              onClick={handleGenerateMatch}
              className="w-full py-3 rounded-xl bg-pink-500/15 border border-pink-500/40 text-pink-300 hover:bg-pink-500/25 active:scale-[0.98] transition-all text-sm font-semibold text-left px-4 flex items-center gap-3"
            >
              <span className="text-lg">💘</span>
              <div>
                <div>Сгенерировать мэтч</div>
                <div className="text-xs text-pink-300/60 font-normal">Случайный мэтч из mockProfiles</div>
              </div>
            </button>

            {/* 3. Симулировать входящее сообщение */}
            <button
              onClick={handleSimulateMessage}
              className="w-full py-3 rounded-xl bg-blue-500/15 border border-blue-500/40 text-blue-300 hover:bg-blue-500/25 active:scale-[0.98] transition-all text-sm font-semibold text-left px-4 flex items-center gap-3"
            >
              <span className="text-lg">💬</span>
              <div>
                <div>Симулировать сообщение</div>
                <div className="text-xs text-blue-300/60 font-normal">
                  {activeThreadId ? 'В активный чат' : 'Откроет первый чат'}
                </div>
              </div>
            </button>

            {/* 3.5. Сгенерировать суперлайк с сообщением */}
            <button
              onClick={handleGenerateSuperlikeWithMessage}
              className="w-full py-3 rounded-xl bg-yellow-500/15 border border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/25 active:scale-[0.98] transition-all text-sm font-semibold text-left px-4 flex items-center gap-3"
            >
              <span className="text-lg">⭐</span>
              <div>
                <div>Сгенерировать суперлайк с сообщением</div>
                <div className="text-xs text-yellow-300/60 font-normal">София, 22 — сообщение в разделе «Лайки»</div>
              </div>
            </button>

            {/* 4. Переключатель hasProfile */}
            <button
              onClick={handleToggleProfile}
              className={`w-full py-3 rounded-xl border active:scale-[0.98] transition-all text-sm font-semibold text-left px-4 flex items-center gap-3 ${
                hasProfile
                  ? 'bg-green-500/15 border-green-500/40 text-green-300 hover:bg-green-500/25'
                  : 'bg-slate-500/15 border-slate-500/40 text-slate-300 hover:bg-slate-500/25'
              }`}
            >
              <span className="text-lg">{hasProfile ? '🟢' : '⚫'}</span>
              <div>
                <div>hasProfile: {hasProfile ? 'true' : 'false'}</div>
                <div className="text-xs opacity-60 font-normal">
                  {hasProfile ? 'Удалить профиль' : 'Создать заглушку'}
                </div>
              </div>
            </button>
          </div>

          {/* Уведомление о последнем действии */}
          {lastAction && (
            <div className="px-5 pb-4">
              <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-xs text-slate-400">
                ✅ {lastAction}
              </div>
            </div>
          )}

          {/* Футер */}
          <div className="px-5 py-3 border-t border-white/5 bg-white/[0.02]">
            <p className="text-[10px] text-slate-600 text-center">
              Admin Panel v1.0 • {form.name || 'Аноним'} • Чатов: {threads.length}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}