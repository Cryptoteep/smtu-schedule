import React from 'react';
import { X, Download, Smartphone, Apple, ExternalLink, QrCode } from 'lucide-react';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700/80 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ship-gold/10 border border-ship-gold/30 text-ship-gold flex items-center justify-center shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Установить расписание
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Корабелка на вашем смартфоне и планшете
            </p>
          </div>
        </div>

        {/* Platforms options */}
        <div className="space-y-3">
          {/* Android Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Android (APK)</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Нативное приложение, работает 100% офлайн</p>
              </div>
            </div>
            <a
              href="https://github.com/Cryptoteep/smtu-schedule/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shrink-0"
            >
              Скачать APK
            </a>
          </div>

          {/* iOS Safari Guide Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                <Apple className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">iPhone / iPad</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Safari → «Поделиться» → «На экран Домой»</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-bold shrink-0">
              PWA
            </span>
          </div>

          {/* QR Code Quick Scan */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-navy-800 to-navy-900 text-white border border-navy-700 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-ship-gold">
                <QrCode className="w-4 h-4" />
                <span>Быстрый вход с телефона</span>
              </div>
              <p className="text-[11px] text-navy-200">
                Наведите камеру смартфона, чтобы открыть на телефоне
              </p>
            </div>
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https%3A%2F%2Fcryptoteep.github.io%2Fsmtu-schedule%2F&color=0a1a2f&bgcolor=ffffff"
              alt="QR Code"
              className="w-16 h-16 rounded-lg bg-white p-1 shrink-0 shadow-md"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget.parentElement as HTMLElement)?.classList.add('hidden');
              }}
            />
          </div>
        </div>

        {/* Link to full download page */}
        <div className="pt-2 border-t border-slate-200 dark:border-navy-800 flex items-center justify-between">
          <a
            href="./download.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-ship-gold hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Подробная страница загрузки</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-navy-800 dark:hover:bg-navy-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
