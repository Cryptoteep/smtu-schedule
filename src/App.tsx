import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { WeekSelector } from './components/WeekSelector';
import { ScheduleView } from './components/ScheduleView';
import { GroupPickerModal } from './components/GroupPickerModal';
import { TeacherModal } from './components/TeacherModal';
import { CampusGuideModal } from './components/CampusGuideModal';
import { NoteModal } from './components/NoteModal';
import { CalendarExportModal } from './components/CalendarExportModal';
import { DownloadModal } from './components/DownloadModal';
import { BottomNav } from './components/BottomNav';
import { useSchedule } from './hooks/useSchedule';
import { useNotes } from './hooks/useNotes';
import { storage } from './services/storage';
import { Lesson } from './types/schedule';
import { Sparkles, AlertTriangle } from 'lucide-react';

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
    currentGroup,
    schedule,
    loading,
    refreshing,
    error,
    academicWeek,
    weekFilter,
    setWeekFilter,
    effectiveParity,
    selectGroup,
    refresh,
  } = useSchedule();

  // Notes hook
  const { notes, addOrUpdateNote, removeNote } = useNotes(currentGroup.id);

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
      // Don't trigger if typing in input
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

  const handleOpenNote = (lesson: Lesson) => {
    setActiveLessonForNote(lesson);
  };

  // Flatten all lessons from schedule for teacher modal
  const allScheduleLessons = schedule?.days.flatMap((d) => d.lessons) || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Header Bar */}
      <Header
        currentGroup={currentGroup}
        academicWeek={academicWeek}
        refreshing={refreshing}
        theme={theme}
        onToggleTheme={toggleTheme}
        onRefresh={refresh}
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
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 pb-20 sm:pb-8">
        {/* Banner with Group & Academic Week Status */}
        <div className="rounded-2xl bg-gradient-to-r from-navy-800 to-navy-900 text-white p-4 sm:p-5 shadow-lg border border-navy-700/60 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-ship-gold/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-ship-gold text-navy-950 uppercase tracking-wider">
                  Корабелка
                </span>
                <span className="text-xs text-navy-200 font-medium">
                  {schedule?.facultyName || 'СПбГМТУ'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Группа {currentGroup.name}
              </h1>
              <p className="text-xs text-navy-300 mt-0.5">
                {academicWeek.label} • Осенний семестр 2026/2027
              </p>
            </div>

            <button
              onClick={() => setIsCalendarExportOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm text-xs font-bold transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-ship-gold" />
              <span>Синхронизировать</span>
            </button>
          </div>
        </div>

        {/* Parity Filter Tabs */}
        <WeekSelector
          currentFilter={weekFilter}
          onChange={setWeekFilter}
          academicWeek={academicWeek}
        />

        {/* Loading / Error States */}
        {loading && (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-navy-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Загрузка расписания группы {currentGroup.name}...
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

        {/* Schedule Cards */}
        {!loading && schedule && (
          <ScheduleView
            schedule={schedule}
            effectiveParity={effectiveParity}
            notes={notes}
            onOpenTeacher={handleOpenTeacher}
            onOpenCampus={handleOpenCampus}
            onOpenNote={handleOpenNote}
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
        currentGroupId={currentGroup.id}
        onSelectGroup={selectGroup}
      />

      <TeacherModal
        isOpen={activeTeacher !== null}
        onClose={() => setActiveTeacher(null)}
        teacherName={activeTeacher?.name || ''}
        photoUrl={activeTeacher?.photoUrl}
        allLessons={allScheduleLessons}
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
        groupId={currentGroup.id}
        notes={
          activeLessonForNote
            ? notes.filter(
                (n) =>
                  n.subject === activeLessonForNote.subject &&
                  n.time === activeLessonForNote.time
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
