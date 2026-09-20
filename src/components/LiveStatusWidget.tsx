import React, { useState, useEffect } from 'react';
import { Clock, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Lesson } from '../types/schedule';
import { parseTimeRange } from '../services/weekCalculator';
import { getCampusByRoom, getFloorByRoom } from '../data/campuses';

interface LiveStatusWidgetProps {
  todayLessons: Lesson[];
  onOpenCampus: (letter: string) => void;
  onOpenTeacher: (teacherName: string, photoUrl?: string) => void;
}

interface ParsedSlot {
  lesson: Lesson;
  startSec: number;
  endSec: number;
}

function formatCountdown(sec: number): string {
  if (sec <= 0) return '00:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const ss = String(s).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  if (h > 0) {
    return `${h}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export const LiveStatusWidget: React.FC<LiveStatusWidgetProps> = ({
  todayLessons,
  onOpenCampus,
  onOpenTeacher,
}) => {
  const [nowSec, setNowSec] = useState<number>(() => {
    const d = new Date();
    return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setNowSec(d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!todayLessons || todayLessons.length === 0) {
    return null;
  }

  // Parse time ranges for all today's lessons and sort by start time
  const slots: ParsedSlot[] = todayLessons
    .map((lesson) => {
      const range = parseTimeRange(lesson.time);
      if (!range) return null;
      return {
        lesson,
        startSec: range.startMinutes * 60,
        endSec: range.endMinutes * 60,
      };
    })
    .filter((slot): slot is ParsedSlot => slot !== null)
    .sort((a, b) => a.startSec - b.startSec);

  if (slots.length === 0) return null;

  const firstSlot = slots[0];
  const lastSlot = slots[slots.length - 1];

  // 1. Check if a lesson is ongoing
  const ongoing = slots.find((s) => nowSec >= s.startSec && nowSec < s.endSec);
  if (ongoing) {
    const totalDuration = ongoing.endSec - ongoing.startSec;
    const elapsed = Math.max(0, nowSec - ongoing.startSec);
    const progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    const remainSec = Math.max(0, ongoing.endSec - nowSec);
    const campusInfo = getCampusByRoom(ongoing.lesson.room);
    const floor = getFloorByRoom(ongoing.lesson.room);

    return (
      <div className="rounded-2xl p-4 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-teal-500/10 dark:from-emerald-950/40 dark:via-emerald-900/20 dark:to-teal-950/30 border border-emerald-300 dark:border-emerald-700/60 shadow-sm space-y-3 animate-in fade-in duration-300">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Сейчас идёт пара ({ongoing.lesson.timeSlotIndex} пара)
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
            <Clock className="w-3 h-3" />
            <span>Осталось {formatCountdown(remainSec)}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-emerald-200/60 dark:bg-emerald-950/80 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Lesson details */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
              {ongoing.lesson.subject}
            </h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                {ongoing.lesson.rawType || ongoing.lesson.type}
              </span>
              <span>•</span>
              <button
                onClick={() => onOpenCampus(campusInfo?.letter || 'У')}
                className="flex items-center gap-1 font-bold hover:underline"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{ongoing.lesson.room}</span>
                {floor && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-bold">
                    {floor} эт.
                  </span>
                )}
              </button>
            </div>
          </div>

          {ongoing.lesson.teacher && (
            <button
              onClick={() => onOpenTeacher(ongoing.lesson.teacher!.name, ongoing.lesson.teacher?.photoUrl)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/80 dark:bg-navy-900/80 hover:bg-white dark:hover:bg-navy-800 border border-slate-200 dark:border-navy-700 transition"
            >
              {ongoing.lesson.teacher.name}
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. Check if currently in a break between lessons
  const nextSlot = slots.find((s) => s.startSec > nowSec);
  const prevSlot = [...slots].reverse().find((s) => s.endSec <= nowSec);

  if (prevSlot && nextSlot) {
    const breakRemainSec = Math.max(0, nextSlot.startSec - nowSec);
    const nextCampus = getCampusByRoom(nextSlot.lesson.room);
    const nextFloor = getFloorByRoom(nextSlot.lesson.room);

    return (
      <div className="rounded-2xl p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-orange-500/10 dark:from-amber-950/40 dark:via-amber-900/20 dark:to-orange-950/30 border border-amber-300 dark:border-amber-700/60 shadow-sm space-y-2.5 animate-in fade-in duration-300">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Перерыв между парами
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            <span>До звонка {formatCountdown(breakRemainSec)}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-amber-200/60 dark:border-amber-900/40 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400">Следующая пара ({nextSlot.lesson.time.split('-')[0].trim()}):</span>
            <span className="font-bold text-slate-900 dark:text-white">{nextSlot.lesson.subject}</span>
          </div>

          <button
            onClick={() => onOpenCampus(nextCampus?.letter || 'У')}
            className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200 hover:text-amber-700 transition"
          >
            <MapPin className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>{nextSlot.lesson.room}</span>
            {nextFloor && (
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold">
                {nextFloor} эт.
              </span>
            )}
          </button>
        </div>
      </div>
    );
  }

  // 3. Before the first lesson of the day
  if (nowSec < firstSlot.startSec) {
    const untilFirstSec = firstSlot.startSec - nowSec;
    // Show only if within 4 hours (14400s) of start
    if (untilFirstSec <= 14400) {
      const firstCampus = getCampusByRoom(firstSlot.lesson.room);
      return (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-indigo-500/10 dark:from-blue-950/40 dark:via-blue-900/20 dark:to-indigo-950/30 border border-blue-300 dark:border-blue-700/60 shadow-sm space-y-2 animate-in fade-in duration-300">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-black uppercase tracking-wider text-blue-800 dark:text-blue-300">
                До начала 1-й пары
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-800">
              <span>{formatCountdown(untilFirstSec)}</span>
            </div>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between gap-2">
            <span>
              1-я пара в {firstSlot.lesson.time.split('-')[0].trim()}: <strong className="text-slate-900 dark:text-white">{firstSlot.lesson.subject}</strong>
            </span>
            <button
              onClick={() => onOpenCampus(firstCampus?.letter || 'У')}
              className="flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
            >
              <MapPin className="w-3 h-3" />
              <span>{firstSlot.lesson.room}</span>
            </button>
          </div>
        </div>
      );
    }
  }

  // 4. After all lessons of today
  if (nowSec >= lastSlot.endSec) {
    return (
      <div className="rounded-2xl p-3.5 bg-slate-100 dark:bg-navy-900/70 border border-slate-200 dark:border-navy-800 flex items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Занятия на сегодня завершены ({slots.length} пар проведено)
          </span>
        </div>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">Отличного отдыха!</span>
      </div>
    );
  }

  return null;
};
