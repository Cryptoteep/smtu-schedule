import React, { useState } from 'react';
import { X, Trash2, Plus, FileText } from 'lucide-react';
import { Lesson, LessonNote } from '../types/schedule';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson | null;
  groupId: string;
  notes: LessonNote[];
  onSaveNote: (note: LessonNote) => void;
  onDeleteNote: (noteId: string) => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  lesson,
  groupId,
  notes,
  onSaveNote,
  onDeleteNote,
}) => {
  const [newText, setNewText] = useState('');
  const [deadline, setDeadline] = useState('');

  if (!isOpen || !lesson) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const note: LessonNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      groupId,
      subject: lesson.subject,
      dayIndex: lesson.dayIndex || 1,
      time: lesson.time,
      text: newText.trim(),
      deadline: deadline ? deadline : undefined,
      createdAt: new Date().toISOString(),
    };

    onSaveNote(note);
    setNewText('');
    setDeadline('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-white dark:bg-navy-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-navy-800 p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-navy-600 dark:text-ship-accent uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" />
              <span>ДЗ и Заметки к паре</span>
            </div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight mt-1">
              {lesson.subject}
            </h3>
            <p className="text-xs text-slate-400">
              {lesson.time} • {lesson.room}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing notes */}
        <div className="space-y-2">
          {notes.length > 0 ? (
            notes.map((note) => (
              <div
                key={note.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs flex items-start justify-between gap-2"
              >
                <div className="space-y-1">
                  <p className="text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap">
                    {note.text}
                  </p>
                  {note.deadline && (
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      Сдать до: {note.deadline}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onDeleteNote(note.id)}
                  className="p-1 text-slate-400 hover:text-rose-500 transition"
                  title="Удалить заметку"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic py-2">
              Заметок пока нет. Добавьте домашнее задание, тему реферата или вопросы к преподавателю.
            </p>
          )}
        </div>

        {/* Add note form */}
        <form onSubmit={handleAdd} className="space-y-3 pt-2 border-t border-slate-100 dark:border-navy-800">
          <textarea
            placeholder="Текст задания или заметки..."
            rows={2}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs focus:outline-none focus:ring-2 focus:ring-navy-500 dark:text-white resize-none"
          />
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Срок сдачи (напр. 25 октября)"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs focus:outline-none focus:ring-2 focus:ring-navy-500 dark:text-white"
            />
            <button
              type="submit"
              disabled={!newText.trim()}
              className="px-4 py-1.5 rounded-xl bg-navy-700 hover:bg-navy-800 text-white font-semibold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Добавить</span>
            </button>
          </div>
        </form>

        <button
          onClick={onClose}
          className="w-full py-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition hover:bg-slate-200"
        >
          Готово
        </button>
      </div>
    </div>
  );
};
