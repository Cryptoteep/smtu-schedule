import React from 'react';
import { X, MapPin, Navigation, ExternalLink } from 'lucide-react';
import { CAMPUSES } from '../data/campuses';

interface CampusGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLetter?: string;
}

export const CampusGuideModal: React.FC<CampusGuideModalProps> = ({
  isOpen,
  onClose,
  selectedLetter,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-xl bg-white dark:bg-navy-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-navy-800 p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-300">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                Корпуса СПбГМТУ (Корабелки)
              </h3>
              <p className="text-xs text-slate-400">
                Справочник учебных кампусов и расшифровка литер аудиторий
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {Object.values(CAMPUSES).map((campus) => {
            const isHighlighted = selectedLetter && selectedLetter.toUpperCase() === campus.letter;
            return (
              <div
                key={campus.letter}
                className={`overflow-hidden rounded-2xl border transition ${
                  isHighlighted
                    ? 'bg-navy-50/90 dark:bg-navy-800/90 border-navy-500 ring-2 ring-navy-500/20 shadow-md'
                    : 'bg-slate-50/80 dark:bg-navy-950/60 border-slate-200 dark:border-navy-800'
                }`}
              >
                {campus.imageUrl && (
                  <div className="relative w-full h-36 sm:h-44 overflow-hidden bg-slate-200 dark:bg-navy-950">
                    <img
                      src={campus.imageUrl}
                      alt={campus.fullName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-navy-950/20 to-transparent pointer-events-none" />
                    <div className="absolute top-3 left-3">
                      <span className="w-8 h-8 rounded-xl bg-navy-900/90 backdrop-blur-md text-white font-extrabold flex items-center justify-center text-sm shadow-md border border-white/20">
                        {campus.letter}
                      </span>
                    </div>
                    <div className="absolute bottom-2.5 left-3 right-3 text-white flex items-end justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-white drop-shadow-sm leading-tight">
                          {campus.fullName}
                        </h4>
                        <span className="text-[11px] font-medium text-emerald-300 drop-shadow-sm">
                          {campus.metro}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-3.5 space-y-2.5">
                  {!campus.imageUrl && (
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-navy-700 text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
                        {campus.letter}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {campus.fullName}
                        </h4>
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          {campus.metro}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <p className="font-medium flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{campus.address}</span>
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                      {campus.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-navy-800/60">
                    <a
                      href={campus.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-navy-700 dark:text-navy-300 hover:bg-navy-50 dark:hover:bg-navy-700 transition shadow-sm"
                    >
                      <Navigation className="w-3.5 h-3.5 text-navy-500" />
                      <span>Открыть на Яндекс Картах</span>
                      <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
                    </a>

                    {campus.pdfPlanUrl && (
                      <a
                        href={campus.pdfPlanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-navy-50 hover:bg-navy-100 dark:bg-navy-800/80 dark:hover:bg-navy-700 border border-slate-200 dark:border-navy-700 text-navy-700 dark:text-navy-300 transition"
                        title="Поэтажный план корпуса в PDF"
                      >
                        <span>План {campus.floors} эт. (PDF)</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-navy-700 hover:bg-navy-800 text-white font-semibold text-xs transition"
        >
          Понятно
        </button>
      </div>
    </div>
  );
};
