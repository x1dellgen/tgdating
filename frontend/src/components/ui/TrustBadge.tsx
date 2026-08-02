import type { ReactNode } from 'react';

interface TrustBadgeProps {
  icon: ReactNode;
  label: string;
}

export function TrustBadge({ icon, label }: TrustBadgeProps) {
  return (
    <div className="flex flex-col items-center gap-2 p-3">
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
        {icon}
      </div>
      <span className="text-xs font-medium text-white text-center leading-tight">{label}</span>
    </div>
  );
}