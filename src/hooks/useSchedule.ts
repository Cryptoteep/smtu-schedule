import { useState, useEffect, useCallback } from 'react';
import { GroupItem, GroupSchedule, ViewWeekFilter } from '../types/schedule';
import { api } from '../services/api';
import { storage } from '../services/storage';
import { getAcademicWeek } from '../services/weekCalculator';

const DEFAULT_GROUP: GroupItem = { id: '7624', name: '3210', course: 2 };

export function useSchedule() {
  const [currentGroup, setCurrentGroupState] = useState<GroupItem>(() => {
    return storage.getCurrentGroup() || DEFAULT_GROUP;
  });
  const [schedule, setSchedule] = useState<GroupSchedule | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [weekFilter, setWeekFilter] = useState<ViewWeekFilter>('current');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const academicWeek = getAcademicWeek(new Date());

  const effectiveParity: 'up' | 'down' | 'all' =
    weekFilter === 'current' ? academicWeek.parity : weekFilter;

  const loadSchedule = useCallback(
    async (group: GroupItem, force = false) => {
      try {
        if (force) setRefreshing(true);
        else setLoading(true);
        setError(null);

        const data = await api.getSchedule(group.id, group.name, force);
        setSchedule(data);
      } catch (err: unknown) {
        console.error('Failed to load schedule:', err);
        setError(err instanceof Error ? err.message : 'Не удалось загрузить расписание');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadSchedule(currentGroup);
  }, [currentGroup, loadSchedule]);

  const selectGroup = useCallback(
    (group: GroupItem) => {
      setCurrentGroupState(group);
      storage.setCurrentGroup(group);
      loadSchedule(group);
    },
    [loadSchedule]
  );

  const refresh = useCallback(() => {
    loadSchedule(currentGroup, true);
  }, [currentGroup, loadSchedule]);

  return {
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
  };
}
