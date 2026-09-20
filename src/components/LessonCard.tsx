import React from 'react';
import { Clock, MapPin, User, FileText, CheckCircle2, AlertCircle, Navigation, Users } from 'lucide-react';
import { Lesson, LessonNote, ScheduleMode } from '../types/schedule';
import { getLessonStatus } from '../services/weekCalculator';
import { getCampusByRoom, getFloorByRoom } from '../data/campuses';

interface LessonCardProps {
  lesson: Lesson;
  notes: LessonNote[];
  mode?: ScheduleMode;
  onOpenTeacher: (teacherName: string, photoUrl?: string) => void;
  onOpenCampus: (letter: string) => void;
  onOpenNote: (lesson: Lesson) => void;
  onSelectGroupByName?: (groupName: string) => void;
  isToday: boolean;
}

export const LessonCard: React.FC<LessonCardProps> = ({
  lesson,
  notes,
  mode = 'group',
  onOpenTeacher,
  onOpenCampus,
  onOpenNote,
  onSelectGroupByName,
  isToday,
}) => {
  const currentStatus = isToday ? getLessonStatus(lesson.time) : { status: 'passed' as const };
  const isActive = isToday && currentStatus.status === 'active';
  const isUpcoming = isToday && currentStatus.status === 'upcoming';

  const typeStyles: Record<string, { bg: string; text: string; border: string }> = {
    lecture: {
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
    },
    practice: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
    lab: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
    },
    military: {
      bg: 'bg-purple-500/10 dark:bg-purple-500/20',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800',
    },
    exam: {
      bg: 'bg-rose-500/10 dark:bg-rose-500/20',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
    },
    other: {
      bg: 'bg-slate-500/10 dark:bg-slate-500/20',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-800',
    },
  };

  const style = typeStyles[lesson.type] || typeStyles.other;

  return (
    <div
      className={`relative rounded-2xl p-4 transition-all duration-200 border ${
        isActive
          ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-500 dark:border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
          : 'bg-white dark:bg-navy-900/60 border-slate-200/80 dark:border-navy-800 hover:border-slate-300 dark:hover:border-navy-700 shadow-sm'
      }`}
    >
      {/* Top row: Time, Slot, Status, Parity */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-sm tracking-tight text-navy-950 dark:text-slate-100">
            <Clock className="w-3.5 h-3.5 text-navy-500 dark:text-navy-400" />
            <span>{lesson.time}</span>
          </div>
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            • {lesson.timeSlotIndex} пара
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Active now / upcoming status indicator */}
          {isActive && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500 text-white shadow-sm animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span>Идёт пара ({currentStatus.minutesRemaining} мин)</span>
            </span>
          )}
          {isUpcoming && currentStatus.minutesUntilStart !== undefined && currentStatus.minutesUntilStart <= 60 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <AlertCircle className="w-3 h-3" />
              <span>Через {currentStatus.minutesUntilStart} мин</span>
            </span>
          )}

          {/* Week parity badge */}
          {lesson.weekParity === 'up' && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              ▲ Числитель
            </span>
          )}
          {lesson.weekParity === 'down' && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              ▼ Знаменатель
            </span>
          )}
        </div>
      </div>

      {/* Lesson Subject & Type */}
      <div className="mb-3">
        <h4 className="font-bold text-base text-slate-900 dark:text-white leading-snug tracking-tight mb-1.5">
          {lesson.subject}
        </h4>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}>
            {lesson.rawType || lesson.type}
          </span>
          {lesson.dateSpecific && (
            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300">
              📅 {lesson.dateSpecific}
            </span>
          )}
          {lesson.dateRange && (
            <span
              className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300"
              title={lesson.exactDates?.length ? `Даты занятий: ${lesson.exactDates.join(', ')}` : undefined}
            >
              🗓️ {lesson.dateRange}
            </span>
          )}
        </div>
      </div>

      {/* Location, Teacher, Notes */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-navy-800/80 text-xs">
        {/* Room and Campus */}
        {(() => {
          const campusInfo = getCampusByRoom(lesson.room);
          const floor = getFloorByRoom(lesson.room);
          const campusLetter = campusInfo?.letter || 'У';
          return (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenCampus(campusLetter)}
                className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 hover:text-navy-600 dark:hover:text-ship-gold transition group text-left"
                title={`Посмотреть ${campusInfo?.fullName || 'корпус'} и поэтажные планы`}
              >
                <div className="p-1 rounded bg-slate-100 dark:bg-navy-800 text-navy-600 dark:text-navy-300 group-hover:bg-navy-100 dark:group-hover:bg-navy-700 transition">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold">{lesson.room}</span>
                {floor && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-700">
                    {floor} эт.
                  </span>
                )}
                <span className="text-slate-400 dark:text-slate-500">
                  ({campusInfo?.name || lesson.campus || 'СПбГМТУ'})
                </span>
              </button>
              {campusInfo?.mapsUrl && (
                <a
                  href={campusInfo.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded text-slate-400 hover:text-navy-600 dark:hover:text-ship-gold hover:bg-slate-100 dark:hover:bg-navy-800 transition"
                  title="Открыть корпус на Яндекс Картах"
                >
                  <Navigation className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          );
        })()}

        {/* Teacher */}
        {lesson.teacher ? (
          <button
            onClick={() => onOpenTeacher(lesson.teacher!.name, lesson.teacher?.photoUrl)}
            className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 hover:text-navy-600 dark:hover:text-ship-gold transition max-w-[200px] truncate"
            title="Преподаватель"
          >
            {lesson.teacher.photoUrl ? (
              <img
                src={lesson.teacher.photoUrl}
                alt={lesson.teacher.name}
                className="w-5 h-5 rounded-full object-cover border border-slate-200 dark:border-navy-700"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-navy-800 flex items-center justify-center text-slate-500">
                <User className="w-3 h-3" />
              </div>
            )}
            <span className="truncate">{lesson.teacher.name}</span>
          </button>
        ) : (
          <span className="text-slate-400">Преподаватель не указан</span>
        )}

        {/* Notes & Homework Button */}
        <button
          onClick={() => onOpenNote(lesson)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg transition font-medium text-xs ${
            notes.length > 0
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800'
          }`}
          title="Заметки и домашнее задание"
        >
          {notes.length > 0 ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
              <span>{notes.length} {notes.length === 1 ? 'заметка' : 'заметки'}</span>
            </>
          ) : (
            <>
              <FileText className="w-3.5 h-3.5" />
              <span>+ ДЗ / Заметка</span>
            </>
          )}
        </button>
      </div>

      {/* For Teacher Mode or when groupName is explicitly present: Clickable Group badge */}
      {mode === 'teacher' && lesson.groupName && (
        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100 dark:border-navy-800/80 text-xs">
          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-400 font-medium">Группа:</span>
          <div className="flex flex-wrap gap-1">
            {lesson.groupName.split(',').map((grp) => {
              const cleanGrp = grp.trim();
              return (
                <button
                  key={cleanGrp}
                  onClick={() => onSelectGroupByName?.(cleanGrp)}
                  className="px-2 py-0.5 rounded-md font-bold text-xs bg-navy-100/80 dark:bg-navy-800 text-navy-800 dark:text-ship-gold hover:bg-navy-200 dark:hover:bg-navy-700 transition"
                  title={`Перейти к расписанию группы ${cleanGrp}`}
                >
                  {cleanGrp}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
