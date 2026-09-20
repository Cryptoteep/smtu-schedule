import React from 'react';
import { X, User, BookOpen, Clock, MapPin, ExternalLink, Calendar } from 'lucide-react';
import { Lesson } from '../types/schedule';

interface TeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherName: string;
  photoUrl?: string;
  allLessons?: Lesson[];
  onOpenTeacherSchedule?: (teacherName: string) => void;
}

export const TeacherModal: React.FC<TeacherModalProps> = ({
  isOpen,
  onClose,
  teacherName,
  photoUrl,
  allLessons = [],
  onOpenTeacherSchedule,
}) => {
  if (!isOpen || !teacherName) return null;

  const teacherLessons = allLessons.filter(
    (l) => l.teacher?.name.toLowerCase() === teacherName.toLowerCase()
  );

  const teacherLesson = teacherLessons.find((l) => l.teacher?.profileUrl || l.teacher?.id);
  const profileUrl =
    teacherLesson?.teacher?.profileUrl ||
    (teacherLesson?.teacher?.id ? `https://www.smtu.ru/ru/viewperson/${teacherLesson.teacher.id}/` : undefined);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-white dark:bg-navy-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-navy-800 p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={teacherName}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-ship-gold/50 shadow-md"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-300 flex items-center justify-center shadow-md">
                <User className="w-7 h-7" />
              </div>
            )}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Преподаватель СПбГМТУ
              </span>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                {teacherName}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action: Open Full Teacher Schedule */}
        {onOpenTeacherSchedule && (
          <button
            onClick={() => {
              onOpenTeacherSchedule(teacherName);
              onClose();
            }}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-ship-gold/15 hover:bg-ship-gold/25 border border-ship-gold/40 text-xs font-bold text-navy-900 dark:text-ship-gold transition shadow-sm"
          >
            <Calendar className="w-4 h-4 text-ship-gold" />
            <span>Открыть полное расписание преподавателя</span>
          </button>
        )}

        {/* External Link to Official SMTU Person Page */}
        {profileUrl && (
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-navy-50 hover:bg-navy-100 dark:bg-navy-800/80 dark:hover:bg-navy-700 border border-slate-200 dark:border-navy-700 text-xs font-bold text-navy-800 dark:text-ship-gold transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Страница преподавателя на smtu.ru</span>
          </a>
        )}

        {/* Subjects taught by this teacher in this group */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-navy-800">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-navy-500" />
            <span>Дисциплины преподавателя</span>
          </h4>

          {teacherLessons.length > 0 ? (
            <div className="space-y-2">
              {teacherLessons.map((l) => (
                <div
                  key={l.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs space-y-1"
                >
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {l.subject}
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{l.time}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{l.room} ({l.campus})</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Нажмите кнопку выше, чтобы просмотреть расписание всех занятий данного преподавателя во всех группах.
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-navy-700 hover:bg-navy-800 text-white font-semibold text-xs transition"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
};
