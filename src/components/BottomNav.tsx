import React from 'react';
import { Users, MapPin, Download, Search } from 'lucide-react';

interface BottomNavProps {
  onOpenGroups: () => void;
  onOpenCampuses: () => void;
  onOpenExport: () => void;
  onOpenSearch: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  onOpenGroups,
  onOpenCampuses,
  onOpenExport,
  onOpenSearch,
}) => {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-navy-950/95 backdrop-blur-md border-t border-slate-200 dark:border-navy-800 safe-bottom">
      <div className="grid grid-cols-4 h-14">
        <button
          onClick={onOpenGroups}
          className="flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:text-navy-600 dark:hover:text-white transition"
        >
          <Users className="w-4 h-4" />
          <span className="text-[10px] font-semibold">Группы</span>
        </button>

        <button
          onClick={onOpenSearch}
          className="flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:text-navy-600 dark:hover:text-white transition"
        >
          <Search className="w-4 h-4" />
          <span className="text-[10px] font-semibold">Поиск</span>
        </button>

        <button
          onClick={onOpenCampuses}
          className="flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:text-navy-600 dark:hover:text-white transition"
        >
          <MapPin className="w-4 h-4" />
          <span className="text-[10px] font-semibold">Корпуса</span>
        </button>

        <button
          onClick={onOpenExport}
          className="flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:text-navy-600 dark:hover:text-white transition"
        >
          <Download className="w-4 h-4" />
          <span className="text-[10px] font-semibold">Календарь</span>
        </button>
      </div>
    </nav>
  );
};
