import { useScreen } from '../../context/ScreenContext';
import { CardButton } from '../../components/ui/CardButton';
import { TrustBadge } from '../../components/ui/TrustBadge';

function readHasProfile(): boolean {
  try {
    const raw = localStorage.getItem('dateme_user_profile');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray(parsed.photos) &&
      parsed.photos.length > 0 &&
      typeof parsed.name === 'string' &&
      parsed.name.trim().length > 0
    );
  } catch {
    return false;
  }
}

/* ─── SVG-иконки ─── */

function HeartIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function ChatBubbleIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg className="w-5 h-5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

/* ─── Иллюстрация ChatBubbles ─── */

function ChatBubbles() {
  return (
    <div className="relative w-40 h-40 mx-auto">
      {/* Левое облачко — розовое сердце */}
      <div className="absolute left-0 top-3 w-[72px] h-[72px] rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(236,72,153,0.15)]">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/10 flex items-center justify-center ring-1 ring-pink-400/20">
          <HeartIcon className="w-6 h-6 text-pink-400" />
        </div>
      </div>

      {/* Правое облачко — синие точки чата */}
      <div className="absolute right-0 bottom-2 w-[72px] h-[72px] rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.15)]">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 flex items-center justify-center ring-1 ring-blue-400/20">
          <ChatBubbleIcon className="w-6 h-6 text-blue-400" />
        </div>
      </div>

      {/* Центральный соединяющий блик */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/5 to-transparent blur-xl pointer-events-none" />
    </div>
  );
}

/* ─── Главный компонент ─── */

export function WelcomeScreen() {
  const { navigateTo } = useScreen();

  return (
    <div className="max-w-[500px] mx-auto h-[100dvh] flex flex-col justify-between items-center px-6 py-8 bg-premium-gradient overflow-y-auto pb-16">

      {/* Иллюстрация */}
      <div className="mb-4 mt-4">
        <ChatBubbles />
      </div>

      {/* Заголовок */}
      <h1 className="text-3xl font-extrabold tracking-tight text-center mb-1.5 bg-title-gradient bg-clip-text text-transparent">
        DateMe
      </h1>

      {/* Подзаголовок */}
      <p className="text-center text-sm text-slate-400 mb-5">
        Знакомься. Общайся. Найди своё 💗
      </p>

      {/* Карточки-кнопки */}
      <div className="flex flex-col gap-3 w-full mb-10">
        <CardButton
          variant="pink"
          icon={<HeartIcon className="w-6 h-6 text-pink-400" />}
          title="Дейтинг"
          subtitle="Находи людей по интересам и общайся"
          onClick={() => navigateTo(readHasProfile() ? 'dating' : 'onboarding')}
        />
        <CardButton
          variant="blue"
          icon={<ChatBubbleIcon className="w-6 h-6 text-blue-400" />}
          title="Анонимный чат"
          subtitle="Общайся анонимно без регистрации"
          onClick={() => navigateTo('anonymous-chat')}
        />
      </div>

      {/* Блок доверия */}
      <div className="grid grid-cols-3 gap-2 w-full mb-8">
        <TrustBadge icon={<ShieldIcon />} label="Безопасно" />
        <TrustBadge icon={<LockIcon />} label="Конфиденциально" />
        <TrustBadge icon={<SparkleIcon />} label="Интересно" />
      </div>

      {/* Подвал */}
      <footer className="text-center text-[11px] text-slate-500">
        Используя приложение, вы принимаете{' '}
        <a href="#" className="underline text-blue-400 hover:text-blue-300 transition-colors">Условия использования</a>
        {' '}и{' '}
        <a href="#" className="underline text-blue-400 hover:text-blue-300 transition-colors">Политику конфиденциальности</a>
      </footer>
    </div>
  );
}