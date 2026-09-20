import React from 'react';
import { RefreshCw, Sun, Moon, Search, Calendar, MapPin, Bookmark, Download, GraduationCap } from 'lucide-react';
import { GroupItem, TeacherItem, ScheduleMode } from '../types/schedule';
import { AcademicWeekInfo } from '../services/weekCalculator';
import { SmtuLogo } from './SmtuLogo';

interface HeaderProps {
  mode?: ScheduleMode;
  currentGroup: GroupItem;
  currentTeacher?: TeacherItem | null;
  academicWeek: AcademicWeekInfo;
  refreshing: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onRefresh: () => void;
  onOpenGroupPicker: () => void;
  onOpenSearch: () => void;
  onOpenCampusGuide: () => void;
  onOpenCalendarExport: () => void;
  onOpenDownload?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode = 'group',
  currentGroup,
  currentTeacher,
  academicWeek,
  refreshing,
  theme,
  onToggleTheme,
  onRefresh,
  onOpenGroupPicker,
  onOpenSearch,
  onOpenCampusGuide,
  onOpenCalendarExport,
  onOpenDownload,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-navy-950/90 backdrop-blur-md border-b border-slate-200 dark:border-navy-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-navy-900 dark:bg-navy-900 border border-slate-200 dark:border-navy-800 flex items-center justify-center shadow-sm shrink-0 overflow-hidden p-1.5 text-ship-gold">
            <SmtuLogo className="w-6 h-6 text-ship-gold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-navy-950 dark:text-white">
                СПбГМТУ
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-300">
                Корабелка
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Расписание занятий
            </p>
          </div>
        </div>

        {/* Center: Group/Teacher Selector & Week Indicator */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenGroupPicker}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-navy-900 dark:hover:bg-navy-800 border border-slate-200 dark:border-navy-700 transition font-semibold text-sm text-navy-900 dark:text-white max-w-[190px] sm:max-w-[280px]"
            title={mode === 'teacher' ? 'Сменить преподавателя' : 'Сменить учебную группу'}
          >
            {mode === 'teacher' && currentTeacher ? (
              <>
                <GraduationCap className="w-3.5 h-3.5 text-ship-gold shrink-0" />
                <span className="truncate">{currentTeacher.name}</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5 text-ship-gold fill-ship-gold/20 shrink-0" />
                <span className="truncate">Гр. {currentGroup.name}</span>
              </>
            )}
            <span className="text-xs text-slate-400 font-normal shrink-0">▾</span>
          </button>

          <div
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-navy-50 dark:bg-navy-900/60 border border-navy-100 dark:border-navy-800 text-xs font-medium text-navy-700 dark:text-navy-300"
            title="Текущая учебная неделя"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                academicWeek.parity === 'up' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span>{academicWeek.label}</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenSearch}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-900 transition"
            title="Поиск групп и преподавателей"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenCampusGuide}
            className="hidden sm:flex p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-900 transition"
            title="Корпуса СПбГМТУ (Ульянка, Лоцманская, Горьковская)"
          >
            <MapPin className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenCalendarExport}
            className="hidden sm:flex p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-900 transition"
            title="Экспорт в календарь iPhone / Android (.ics)"
          >
            <Calendar className="w-4 h-4" />
          </button>

          {onOpenDownload && (
            <button
              onClick={onOpenDownload}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-ship-gold/10 hover:bg-ship-gold/20 text-ship-gold border border-ship-gold/30 transition text-xs font-bold"
              title="Скачать APK для Android или установить на iPhone"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Скачать</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={refreshing}
            className={`p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-900 transition ${
              refreshing ? 'opacity-50' : ''
            }`}
            title="Обновить расписание с сайта СПбГМТУ"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-navy-500' : ''}`} />
          </button>

          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-900 transition"
            title={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
