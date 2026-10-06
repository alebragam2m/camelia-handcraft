import { useEffect } from 'react';

export type BrandNoticeState = {
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
};

export default function BrandNotice({ notice, onClose }: { notice: BrandNoticeState | null; onClose: () => void }) {
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(onClose, 4500);
    return () => window.clearTimeout(timeout);
  }, [notice, onClose]);

  if (!notice) return null;

  const accent = notice.type === 'success'
    ? 'bg-emerald-500'
    : notice.type === 'error' ? 'bg-red-500' : 'bg-primaria';
  const icon = notice.type === 'success' ? '✓' : notice.type === 'error' ? '!' : 'i';

  return (
    <div className="fixed top-6 right-6 z-[350] w-[min(420px,calc(100vw-3rem))] animate-fade-in-down" role={notice.type === 'error' ? 'alert' : 'status'} aria-live="polite">
      <div className="relative overflow-hidden rounded-2xl bg-white border border-white/70 shadow-2xl shadow-secundaria/20">
        <div className={`absolute inset-y-0 left-0 w-1.5 ${accent}`} />
        <div className="flex items-start gap-4 p-5 pl-6">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-fundo border border-primaria/10">
            <img src="/logo.png" alt="" className="h-8 w-8 object-contain" />
            <span className={`absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black text-white ${accent}`}>{icon}</span>
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="font-serif text-lg font-bold text-secundaria">{notice.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-500">{notice.message}</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-300 hover:text-secundaria font-bold" aria-label="Fechar notificação">×</button>
        </div>
        <div className={`h-1 ${accent} opacity-20`} />
      </div>
    </div>
  );
}
