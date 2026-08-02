import { useEffect, Component, type ReactNode, type ErrorInfo } from 'react';
import { ScreenProvider, useScreen } from './context/ScreenContext';
import { RegistrationProvider } from './context/RegistrationContext';
import { MatchProvider, useMatch } from './context/MatchContext';
import { ChatProvider, useChat } from './context/ChatContext';
import { AnonymousChatProvider } from './context/AnonymousChatContext';
import { useTelegram } from './hooks/useTelegram';
import { WelcomeScreen } from './features/welcome/WelcomeScreen';
import { OnboardingScreen } from './features/onboarding/OnboardingScreen';
import { DatingLayout } from './features/dating/DatingLayout';
import { SwipesScreen } from './features/swipes/SwipesScreen';
import { AnonymousChatScreen } from './features/anonymous-chat/AnonymousChatScreen';
import { MatchOverlay } from './features/matching/MatchOverlay';
import type { MockProfile } from './features/swipes/mockProfiles';

function ScreenRouter() {
  const { currentScreen } = useScreen();

  switch (currentScreen) {
    case 'welcome':
      return <WelcomeScreen />;
    case 'onboarding':
      return <OnboardingScreen />;
    case 'dating':
      return <DatingLayout />;
    case 'swipes':
      return <SwipesScreen />;
    case 'anonymous-chat':
      return <AnonymousChatScreen />;
    default:
      return <WelcomeScreen />;
  }
}

/** Связывает MatchContext и ChatContext: при каждом мэтче сразу создаёт чат */
function MatchChatConnector() {
  const { setOnMatchCallback } = useMatch();
  const { openChat } = useChat();

  useEffect(() => {
    setOnMatchCallback((profile: MockProfile) => {
      openChat(profile);
    });
    return () => setOnMatchCallback(null);
  }, [setOnMatchCallback, openChat]);

  return null;
}

/* ─── Error Boundary ─── */

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-[100dvh] flex flex-col items-center justify-center px-6 bg-slate-950 text-center">
          <div className="text-5xl mb-4">😵</div>
          <h1 className="text-xl font-bold text-white mb-2">Что-то пошло не так</h1>
          <p className="text-slate-400 text-sm mb-6 max-w-xs">
            Произошла непредвиденная ошибка. Попробуйте перезагрузить приложение.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold text-sm shadow-lg shadow-pink-500/20 hover:from-pink-400 hover:to-rose-400 transition-all active:scale-[0.97]"
          >
            🔄 Перезагрузить приложение
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  useTelegram();

  return (
    <ErrorBoundary>
      <div className="h-[100dvh] overflow-hidden">
        <ScreenProvider>
          <RegistrationProvider>
            <MatchProvider>
              <ChatProvider>
                <AnonymousChatProvider>
                  <MatchChatConnector />
                  <ScreenRouter />
                  <MatchOverlay />
                </AnonymousChatProvider>
              </ChatProvider>
            </MatchProvider>
          </RegistrationProvider>
        </ScreenProvider>
      </div>
    </ErrorBoundary>
  );
}
