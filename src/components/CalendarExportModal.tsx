import React, { useState } from 'react';
import { X, Calendar, Download, CheckCircle, Smartphone, Monitor } from 'lucide-react';
import { GroupSchedule } from '../types/schedule';
import { downloadIcsFile } from '../services/calendarExport';

interface CalendarExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: GroupSchedule | null;
}

export const CalendarExportModal: React.FC<CalendarExportModalProps> = ({
  isOpen,
  onClose,
  schedule,
}) => {
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen || !schedule) return null;

  const handleDownload = () => {
    const ok = downloadIcsFile(schedule);
    if (ok) {
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 4000);
    }
  };

  const isTeacher =
    schedule.groupId.startsWith('teacher_') || schedule.facultyName === 'Преподаватель СПбГМТУ';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-white dark:bg-navy-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-navy-800 p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-300">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                Экспорт в Календарь
              </h3>
              <p className="text-xs text-slate-400">
                {isTeacher
                  ? `Синхронизация расписания преподавателя ${schedule.groupName}`
                  : `Синхронизация расписания группы ${schedule.groupName}`}
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

        <div className="p-4 rounded-2xl bg-navy-50/70 dark:bg-navy-950/50 border border-navy-100 dark:border-navy-800 text-xs space-y-2 text-slate-700 dark:text-slate-300">
          <p className="font-semibold text-navy-900 dark:text-white">
            Расписание будет экспортировано в стандартный формат iCalendar (.ics).
          </p>
          <div className="space-y-1.5 pt-1 text-[11px]">
            <div className="flex items-start gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-navy-500 shrink-0 mt-0.5" />
              <span>
                <strong>На iPhone / iOS:</strong> файл .ics открывается прямо в Safari и автоматически предлагает добавить все пары в Apple Календарь с повторением по четным/нечетным неделям.
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-navy-500 shrink-0 mt-0.5" />
              <span>
                <strong>На Android и ПК:</strong> импортируйте скачанный файл в Google Календарь (Настройки → Импорт и экспорт) или Яндекс Календарь.
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleDownload}
          className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition ${
            downloaded
              ? 'bg-emerald-600 text-white'
              : 'bg-navy-700 hover:bg-navy-800 text-white'
          }`}
        >
          {downloaded ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Файл .ics скачан!</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>
                Скачать календарь {isTeacher ? `преподавателя ${schedule.groupName}` : `группы ${schedule.groupName}`} (.ics)
              </span>
            </>
          )}
        </button>

        <button
          onClick={onClose}
          className="w-full py-2 text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
        >
          Отмена
        </button>
      </div>
    </div>
  );
};
