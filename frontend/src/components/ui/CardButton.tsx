import type { ReactNode } from 'react';

type CardButtonVariant = 'pink' | 'blue';

interface CardButtonProps {
  variant: CardButtonVariant;
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}

const variantStyles: Record<CardButtonVariant, { glow: string; accent: string; chevron: string }> = {
  pink: {
    glow: 'hover:shadow-[0_0_20px_rgba(236,72,153,0.2)] focus-visible:shadow-[0_0_20px_rgba(236,72,153,0.3)] border-pink-500/30',
    accent: 'from-pink-500/20 to-rose-500/10',
    chevron: 'text-pink-400',
  },
  blue: {
    glow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] focus-visible:shadow-[0_0_20px_rgba(59,130,246,0.3)] border-blue-500/30',
    accent: 'from-blue-500/20 to-indigo-500/10',
    chevron: 'text-blue-400',
  },
};

export function CardButton({ variant, icon, title, subtitle, onClick }: CardButtonProps) {
  const s = variantStyles[variant];

  return (
    <button
      onClick={onClick}
      className={`
        group flex items-center gap-4 w-full p-4 rounded-2xl text-left
        bg-white/5 backdrop-blur-sm border border-white/10 ${s.glow}
        transition-all duration-300 active:scale-[0.97]
      `.replace(/\s+/g, ' ').trim()}
    >
      {/* Иконка с градиентной подложкой */}
      <div
        className={`
          w-12 h-12 rounded-xl bg-gradient-to-br ${s.accent}
          flex items-center justify-center flex-shrink-0
          ring-1 ring-white/10
        `.replace(/\s+/g, ' ').trim()}
      >
        {icon}
      </div>

      {/* Текст */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[15px] text-white">{title}</div>
        <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>
      </div>

      {/* Chevron */}
      <svg
        className={`w-5 h-5 ${s.chevron} flex-shrink-0 transition-transform duration-300 group-hover:translate-x-0.5`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  );
}