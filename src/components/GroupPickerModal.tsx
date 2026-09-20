import React, { useState, useMemo } from 'react';
import { X, Search, Star, History, ChevronRight, ChevronDown } from 'lucide-react';
import { Faculty, GroupItem } from '../types/schedule';
import { api } from '../services/api';
import { storage } from '../services/storage';

interface GroupPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGroupId: string;
  onSelectGroup: (group: GroupItem) => void;
}

export const GroupPickerModal: React.FC<GroupPickerModalProps> = ({
  isOpen,
  onClose,
  currentGroupId,
  onSelectGroup,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaculty, setExpandedFaculty] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);

  const faculties: Faculty[] = useMemo(() => api.getFaculties(), []);
  const favorites: GroupItem[] = storage.getFavorites();
  const recents: GroupItem[] = storage.getRecentGroups();

  const searchResults = useMemo(() => {
    return api.searchGroups(searchQuery);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSelect = (group: GroupItem) => {
    onSelectGroup(group);
    onClose();
  };

  const handleToggleFav = (e: React.MouseEvent, group: GroupItem) => {
    e.stopPropagation();
    storage.toggleFavorite(group);
    // force re-render
    setSearchQuery(q => q);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-2xl bg-white dark:bg-navy-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-navy-800 max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-navy-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              Выбор учебной группы
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              412 групп по 8 факультетам СПбГМТУ
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-navy-800 shrink-0 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск по номеру (например: 3210, 1201, 12509)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 dark:text-white"
            />
          </div>

          {/* Course filter buttons */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <span className="text-xs font-semibold text-slate-400 mr-1.5 shrink-0">Курс:</span>
            <button
              onClick={() => setSelectedCourse(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition ${
                selectedCourse === null
                  ? 'bg-navy-700 text-white'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Все
            </button>
            {[1, 2, 3, 4, 5, 6].map((course) => (
              <button
                key={course}
                onClick={() => setSelectedCourse(selectedCourse === course ? null : course)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition ${
                  selectedCourse === course
                    ? 'bg-navy-700 text-white'
                    : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {course} курс
              </button>
            ))}
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {searchQuery.trim().length > 0 ? (
            /* Search Results */
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Результаты поиска ({searchResults.length})
              </span>
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {searchResults.map(({ group, faculty }) => {
                    const isSelected = group.id === currentGroupId;
                    const isFav = storage.isFavorite(group.id);
                    return (
                      <div
                        key={group.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelect(group)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSelect(group); }}
                        className={`flex items-center justify-between p-3 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-navy-50 dark:bg-navy-800/80 border-navy-500 ring-1 ring-navy-500'
                            : 'bg-slate-50 dark:bg-navy-950/50 border-slate-200 dark:border-navy-800 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white">
                            {group.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            {faculty.shortName}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleToggleFav(e, group)}
                          className="p-1 text-slate-300 hover:text-amber-400 transition"
                        >
                          <Star className={`w-3.5 h-3.5 ${isFav ? 'text-amber-400 fill-amber-400' : ''}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Группа не найдена. Проверьте правильность номера.
                </div>
              )}
            </div>
          ) : (
            /* Normal Mode: Favorites, Recents, and Faculties */
            <>
              {/* Favorites */}
              {favorites.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <span>Избранные группы</span>
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {favorites.map((group) => (
                      <button
                        key={group.id}
                        onClick={() => handleSelect(group)}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-left hover:border-amber-400 transition"
                      >
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {group.name}
                        </span>
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recents */}
              {recents.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <History className="w-3.5 h-3.5" />
                    <span>Недавние группы</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {recents.map((group) => (
                      <button
                        key={group.id}
                        onClick={() => handleSelect(group)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-800 transition"
                      >
                        {group.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Faculties Accordion */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Факультеты СПбГМТУ
                </span>
                <div className="space-y-2">
                  {faculties.map((faculty) => {
                    const isExpanded = expandedFaculty === faculty.faculty;
                    const filteredGroups = selectedCourse
                      ? faculty.groups.filter((g) => g.course === selectedCourse)
                      : faculty.groups;

                    return (
                      <div
                        key={faculty.faculty}
                        className="rounded-2xl border border-slate-200 dark:border-navy-800 overflow-hidden bg-slate-50/50 dark:bg-navy-950/30"
                      >
                        <button
                          onClick={() => setExpandedFaculty(isExpanded ? null : faculty.faculty)}
                          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-100/60 dark:hover:bg-navy-800/40 transition"
                        >
                          <div>
                            <div className="font-bold text-sm text-slate-900 dark:text-white">
                              {faculty.faculty}
                            </div>
                            <div className="text-xs text-slate-400 font-medium">
                              {faculty.shortName} • {faculty.groupsCount} групп
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="p-3 pt-0 border-t border-slate-200/60 dark:border-navy-800/60 bg-white dark:bg-navy-900/60">
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 mt-2.5 max-h-60 overflow-y-auto pr-1">
                              {filteredGroups.map((group) => {
                                const isSelected = group.id === currentGroupId;
                                return (
                                  <button
                                    key={group.id}
                                    onClick={() => handleSelect(group)}
                                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center border transition ${
                                      isSelected
                                        ? 'bg-navy-700 text-white border-navy-700'
                                        : 'bg-slate-50 dark:bg-navy-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-navy-800 hover:border-navy-400'
                                    }`}
                                  >
                                    {group.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
