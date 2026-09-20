import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ScheduleView } from './components/ScheduleView';
import { GroupPickerModal } from './components/GroupPickerModal';
import { TeacherModal } from './components/TeacherModal';
import { CampusGuideModal } from './components/CampusGuideModal';
import { NoteModal } from './components/NoteModal';
import { CalendarExportModal } from './components/CalendarExportModal';
import { DownloadModal } from './components/DownloadModal';
import { LiveStatusWidget } from './components/LiveStatusWidget';
import { BottomNav } from './components/BottomNav';
import { useSchedule } from './hooks/useSchedule';
import { useNotes } from './hooks/useNotes';
import { storage } from './services/storage';
import { api } from './services/api';
import { Lesson } from './types/schedule';
import { filterLessonsByParity } from './services/weekCalculator';
import { Calendar, AlertTriangle } from 'lucide-react';

export const App: React.FC = () => {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = storage.getTheme();
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    storage.setTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  // Schedule hook
  const {
    mode,
    currentGroup,
    currentTeacher,
    schedule,
    loading,
    refreshing,
    error,
    academicWeek,
    weekFilter,
    setWeekFilter,
    effectiveParity,
    selectGroup,
    selectTeacher,
    refresh,
  } = useSchedule();

  // Notes hook
  const activeEntityId = mode === 'teacher' ? `t_${currentTeacher?.id || currentTeacher?.name}` : currentGroup.id;
  const { notes, addOrUpdateNote, removeNote } = useNotes(activeEntityId);

  // Modals state
  const [isGroupPickerOpen, setIsGroupPickerOpen] = useState(false);
  const [isCampusGuideOpen, setIsCampusGuideOpen] = useState(false);
  const [selectedCampusLetter, setSelectedCampusLetter] = useState<string | undefined>();
  const [isCalendarExportOpen, setIsCalendarExportOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [activeTeacher, setActiveTeacher] = useState<{ name: string; photoUrl?: string } | null>(null);
  const [activeLessonForNote, setActiveLessonForNote] = useState<Lesson | null>(null);

  // Keyboard shortcuts for PC desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        setIsGroupPickerOpen(true);
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setIsCampusGuideOpen(true);
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setIsDownloadModalOpen(true);
      } else if (e.key === 'Escape') {
        setIsGroupPickerOpen(false);
        setIsCampusGuideOpen(false);
        setIsCalendarExportOpen(false);
        setIsDownloadModalOpen(false);
        setActiveTeacher(null);
        setActiveLessonForNote(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenCampus = (letter: string) => {
    setSelectedCampusLetter(letter);
    setIsCampusGuideOpen(true);
  };

  const handleOpenTeacher = (name: string, photoUrl?: string) => {
    setActiveTeacher({ name, photoUrl });
  };

  const handleOpenTeacherSchedule = (teacherName: string) => {
    const match = api.findTeacher(teacherName);
    if (match) {
      selectTeacher(match);
    } else {
      selectTeacher({ id: teacherName, name: teacherName });
    }
  };

  const handleSelectGroupByName = (groupName: string) => {
    const match = api.findGroup(groupName);
    if (match) {
      selectGroup(match.group);
    } else {
      selectGroup({ id: groupName, name: groupName });
    }
  };

  const handleOpenNote = (lesson: Lesson) => {
    setActiveLessonForNote(lesson);
  };

  // Date ticker to ensure todayLessons auto-recalculates across midnight without reload
  const [currentDateKey, setCurrentDateKey] = useState(() => new Date().toDateString());

  useEffect(() => {
    const timer = setInterval(() => {
      const todayStr = new Date().toDateString();
      if (todayStr !== currentDateKey) {
        setCurrentDateKey(todayStr);
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [currentDateKey]);

  // Flatten all lessons from schedule for teacher modal
  const allScheduleLessons = schedule?.days.flatMap((d) => d.lessons) || [];

  // Filter lessons taking place today according to academic week parity
  const todayLessons = React.useMemo(() => {
    if (!schedule) return [];
    const todayJs = new Date().getDay();
    const dayIndex = todayJs === 0 ? 7 : todayJs; // Sunday is 7
    const day = schedule.days.find((d) => d.dayIndex === dayIndex);
    if (!day) return [];
    return filterLessonsByParity(day.lessons, effectiveParity);
  }, [schedule, effectiveParity, currentDateKey]);

  // Handle refresh: updates both ServiceWorker cache and schedule data
  const handleRefresh = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update();
        }
      } catch {}
    }
    await refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Header Bar */}
      <Header
        mode={mode}
        currentGroup={currentGroup}
        currentTeacher={currentTeacher}
        academicWeek={academicWeek}
        refreshing={refreshing}
        theme={theme}
        onToggleTheme={toggleTheme}
        onRefresh={handleRefresh}
        onOpenGroupPicker={() => setIsGroupPickerOpen(true)}
        onOpenSearch={() => setIsGroupPickerOpen(true)}
        onOpenCampusGuide={() => {
          setSelectedCampusLetter(undefined);
          setIsCampusGuideOpen(true);
        }}
        onOpenCalendarExport={() => setIsCalendarExportOpen(true)}
        onOpenDownload={() => setIsDownloadModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-3 pb-20 sm:pb-8">
        {/* Sleek University Context Sub-bar */}
        <div className="flex items-center justify-between gap-3 text-xs px-1 text-slate-500 dark:text-slate-400 font-medium">
          <div className="flex items-center gap-2 truncate">
            <span className="font-extrabold text-navy-950 dark:text-slate-100 truncate">
              {mode === 'teacher'
                ? currentTeacher?.name || 'Преподаватель СПбГМТУ'
                : `Группа ${currentGroup.name}`}
            </span>
            <span>•</span>
            <span className="truncate">{schedule?.facultyName || 'Корабелка'}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Осенний семестр 2026/2027</span>
          </div>

          <button
            onClick={() => setIsCalendarExportOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-navy-800 transition text-xs font-semibold shrink-0"
            title="Экспорт расписания в календарь (.ics)"
          >
            <Calendar className="w-3.5 h-3.5 text-ship-gold" />
            <span>Экспорт .ics</span>
          </button>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-navy-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              {mode === 'teacher'
                ? `Загрузка расписания преподавателя ${currentTeacher?.name || ''}...`
                : `Загрузка расписания группы ${currentGroup.name}...`}
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-3 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div className="flex-1">
              <span className="font-bold">Ошибка: </span>
              <span>{error}</span>
            </div>
            <button
              onClick={refresh}
              className="px-3 py-1 rounded-lg bg-rose-600 text-white font-semibold text-xs"
            >
              Повторить
            </button>
          </div>
        )}

        {/* Live Status / Countdown Bar */}
        {!loading && todayLessons.length > 0 && (
          <LiveStatusWidget
            todayLessons={todayLessons}
            onOpenCampus={handleOpenCampus}
            onOpenTeacher={handleOpenTeacher}
          />
        )}

        {/* Schedule Calendar & Feed */}
        {!loading && schedule && (
          <ScheduleView
            schedule={schedule}
            mode={mode}
            effectiveParity={effectiveParity}
            weekFilter={weekFilter}
            onWeekFilterChange={setWeekFilter}
            academicWeek={academicWeek}
            notes={notes}
            onOpenTeacher={handleOpenTeacher}
            onOpenCampus={handleOpenCampus}
            onOpenNote={handleOpenNote}
            onSelectGroupByName={handleSelectGroupByName}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        onOpenGroups={() => setIsGroupPickerOpen(true)}
        onOpenCampuses={() => {
          setSelectedCampusLetter(undefined);
          setIsCampusGuideOpen(true);
        }}
        onOpenExport={() => setIsCalendarExportOpen(true)}
        onOpenSearch={() => setIsGroupPickerOpen(true)}
      />

      {/* Modals */}
      <GroupPickerModal
        isOpen={isGroupPickerOpen}
        onClose={() => setIsGroupPickerOpen(false)}
        mode={mode}
        currentGroupId={currentGroup.id}
        currentTeacherId={currentTeacher?.id || currentTeacher?.name}
        onSelectGroup={selectGroup}
        onSelectTeacher={selectTeacher}
      />

      <TeacherModal
        isOpen={activeTeacher !== null}
        onClose={() => setActiveTeacher(null)}
        teacherName={activeTeacher?.name || ''}
        photoUrl={activeTeacher?.photoUrl}
        allLessons={allScheduleLessons}
        onOpenTeacherSchedule={handleOpenTeacherSchedule}
      />

      <CampusGuideModal
        isOpen={isCampusGuideOpen}
        onClose={() => setIsCampusGuideOpen(false)}
        selectedLetter={selectedCampusLetter}
      />

      <NoteModal
        isOpen={activeLessonForNote !== null}
        onClose={() => setActiveLessonForNote(null)}
        lesson={activeLessonForNote}
        groupId={activeEntityId}
        notes={
          activeLessonForNote
            ? notes.filter(
                (n) =>
                  n.subject === activeLessonForNote.subject &&
                  n.time === activeLessonForNote.time &&
                  (!n.dayIndex || !activeLessonForNote.dayIndex || n.dayIndex === activeLessonForNote.dayIndex)
              )
            : []
        }
        onSaveNote={addOrUpdateNote}
        onDeleteNote={removeNote}
      />

      <CalendarExportModal
        isOpen={isCalendarExportOpen}
        onClose={() => setIsCalendarExportOpen(false)}
        schedule={schedule}
      />

      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />
    </div>
  );
};
