import { useState, useEffect, useCallback } from 'react';
import { useScreen } from '../../context/ScreenContext';
import { useMatch } from '../../context/MatchContext';
import { useChat } from '../../context/ChatContext';
import { SwipesScreen } from '../swipes/SwipesScreen';
import { CatalogTab } from './CatalogTab';
import { LikesTab } from './LikesTab';
import { ChatsTab } from './ChatsTab';
import { ProfileTab } from './ProfileTab';

type TabId = 'swipes' | 'catalog' | 'likes' | 'chats' | 'profile';

interface TabConfig {
  id: TabId;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

const TABS: TabConfig[] = [
  {
    id: 'swipes',
    label: 'Свайпы',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#f472b6' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
        <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
      </svg>
    ),
  },
  {
    id: 'catalog',
    label: 'Каталог',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#f472b6' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'likes',
    label: 'Лайки',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#f472b6' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    ),
  },
  {
    id: 'chats',
    label: 'Чаты',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#f472b6' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Профиль',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#f472b6' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21a8 8 0 0 0-16 0" />
      </svg>
    ),
  },
];

export function DatingLayout() {
  const { navigateTo } = useScreen();
  const [activeTab, setActiveTab] = useState<TabId>('swipes');
  const { setOnNavigateToChats } = useMatch();
  const { closeChat } = useChat();

  // Сбрасываем активный диалог при переключении на вкладку «Чаты»
  const handleTabSwitch = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
    if (tabId === 'chats') {
      closeChat();
    }
  }, [closeChat]);

  // Регистрируем колбэк для перехода на чаты из MatchOverlay
  useEffect(() => {
    setOnNavigateToChats(() => () => {
      handleTabSwitch('chats');
    });
    return () => setOnNavigateToChats(null);
  }, [setOnNavigateToChats, handleTabSwitch]);

  const renderContent = () => {
    switch (activeTab) {
      case 'swipes':
        return <SwipesScreen />;
      case 'catalog':
        return <CatalogTab />;
      case 'likes':
        return <LikesTab onSwitchTab={handleTabSwitch} />;
      case 'chats':
        return <ChatsTab onSwitchTab={handleTabSwitch} />;
      case 'profile':
        return <ProfileTab />;
      default:
        return <SwipesScreen />;
    }
  };

  return (
    <div className="w-full max-w-[500px] mx-auto h-full flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Шапка дейтинга — компактная */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.02] backdrop-blur-md">
        <button
          onClick={() => navigateTo('welcome')}
          className="text-slate-400 hover:text-white transition-colors p-1.5 -ml-1 flex items-center gap-1"
          title="На портал"
        >
          <span className="text-lg leading-none">←</span>
          <span className="text-xs font-medium">На портал</span>
        </button>
        <div className="flex items-center gap-1.5">
          {/* Место для иконок настроек если понадобятся */}
        </div>
      </header>

      {/* Контент активной вкладки */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderContent()}
      </div>

      {/* Нижний навигационный бар */}
      <nav className="flex items-center justify-around px-2 py-2 bg-black/60 backdrop-blur-md border-t border-white/5 safe-area-bottom">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabSwitch(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-90 ${
                isActive
                  ? 'text-pink-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.icon(isActive)}
              <span className="text-[10px] font-medium leading-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}