import React from 'react';
import { ViewWeekFilter } from '../types/schedule';
import { AcademicWeekInfo } from '../services/weekCalculator';

interface WeekSelectorProps {
  currentFilter: ViewWeekFilter;
  onChange: (filter: ViewWeekFilter) => void;
  academicWeek: AcademicWeekInfo;
}

export const WeekSelector: React.FC<WeekSelectorProps> = ({
  currentFilter,
  onChange,
  academicWeek,
}) => {
  const options: { id: ViewWeekFilter; label: string; badge?: string; badgeColor?: string }[] = [
    {
      id: 'current',
      label: 'Текущая неделя',
      badge: academicWeek.parity === 'up' ? 'Числитель' : 'Знаменатель',
      badgeColor: academicWeek.parity === 'up' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    },
    {
      id: 'up',
      label: '▲ Верхняя',
      badge: 'Числитель',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'down',
      label: '▼ Нижняя',
      badge: 'Знаменатель',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    {
      id: 'all',
      label: 'Все недели',
    },
  ];

  return (
    <div className="w-full overflow-x-auto pb-1 no-scrollbar">
      <div className="inline-flex p-1 bg-slate-200/70 dark:bg-navy-900/80 rounded-xl border border-slate-300/50 dark:border-navy-800 backdrop-blur-sm gap-1 min-w-full sm:min-w-0">
        {options.map((opt) => {
          const active = currentFilter === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onChange(opt.id)}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                active
                  ? 'bg-white dark:bg-navy-800 text-navy-900 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>{opt.label}</span>
              {opt.badge && (
                <span
                  className={`hidden xs:inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                    opt.badgeColor || 'bg-slate-200 dark:bg-navy-700'
                  }`}
                >
                  {opt.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
