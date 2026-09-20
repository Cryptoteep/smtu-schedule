import { useState, useEffect, useCallback } from 'react';
import { GroupItem, GroupSchedule, TeacherItem, ScheduleMode, ViewWeekFilter } from '../types/schedule';
import { api } from '../services/api';
import { storage } from '../services/storage';
import { getAcademicWeek } from '../services/weekCalculator';

const DEFAULT_GROUP: GroupItem = { id: '7624', name: '3210', course: 2 };

export function useSchedule() {
  const [mode, setModeState] = useState<ScheduleMode>(() => storage.getMode());

  const [currentGroup, setCurrentGroupState] = useState<GroupItem>(() => {
    return storage.getCurrentGroup() || DEFAULT_GROUP;
  });

  const [currentTeacher, setCurrentTeacherState] = useState<TeacherItem | null>(() => {
    const saved = storage.getCurrentTeacher();
    if (saved) return saved;
    const all = api.getTeachers();
    return all.length > 0 ? all[0] : null;
  });

  const [schedule, setSchedule] = useState<GroupSchedule | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [weekFilter, setWeekFilter] = useState<ViewWeekFilter>('current');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const academicWeek = getAcademicWeek(new Date());

  const effectiveParity: 'up' | 'down' | 'all' =
    weekFilter === 'current' ? academicWeek.parity : weekFilter;

  // Load schedule based on current mode
  const loadSchedule = useCallback(
    async (targetMode: ScheduleMode, force = false) => {
      try {
        if (force) setRefreshing(true);
        else setLoading(true);
        setError(null);

        if (targetMode === 'teacher') {
          const teacher = currentTeacher || api.getTeachers()[0];
          if (!teacher) {
            setError('Преподаватель не выбран');
            return;
          }
          const teacherSched = await api.getTeacherSchedule(teacher.id, teacher.name, force);
          const adapted = api.teacherScheduleToGroupSchedule(teacherSched);
          setSchedule(adapted);
        } else {
          const data = await api.getSchedule(currentGroup.id, currentGroup.name, force);
          setSchedule(data);
        }
      } catch (err: unknown) {
        console.error('Failed to load schedule:', err);
        setError(err instanceof Error ? err.message : 'Не удалось загрузить расписание');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentGroup, currentTeacher]
  );

  useEffect(() => {
    loadSchedule(mode);
  }, [mode, currentGroup.id, currentTeacher?.id, loadSchedule]);

  const selectGroup = useCallback(
    (group: GroupItem) => {
      setModeState('group');
      storage.setMode('group');
      setCurrentGroupState(group);
      storage.setCurrentGroup(group);
    },
    []
  );

  const selectTeacher = useCallback(
    (teacher: TeacherItem) => {
      setModeState('teacher');
      storage.setMode('teacher');
      setCurrentTeacherState(teacher);
      storage.setCurrentTeacher(teacher);
    },
    []
  );

  const switchMode = useCallback(
    (newMode: ScheduleMode) => {
      setModeState(newMode);
      storage.setMode(newMode);
    },
    []
  );

  const refresh = useCallback(() => {
    loadSchedule(mode, true);
  }, [mode, loadSchedule]);

  return {
    mode,
    switchMode,
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
  };
}
