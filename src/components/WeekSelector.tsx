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
  const options: { id: ViewWeekFilter; label: string; dotColor?: string }[] = [
    {
      id: 'current',
      label: `Текущая (${academicWeek.parityName})`,
      dotColor: academicWeek.parity === 'up' ? 'bg-emerald-500' : 'bg-amber-500',
    },
    {
      id: 'up',
      label: '↑ Верхняя',
    },
    {
      id: 'down',
      label: '↓ Нижняя',
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
                  ? 'bg-white dark:bg-navy-800 text-navy-950 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {opt.dotColor && (
                <span className={`w-2 h-2 rounded-full ${opt.dotColor}`} />
              )}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
