import { useState, useEffect, useCallback } from 'react';
import { LessonNote } from '../types/schedule';
import { storage } from '../services/storage';

export function useNotes(groupId?: string) {
  const [notes, setNotes] = useState<LessonNote[]>([]);

  const loadNotes = useCallback(() => {
    setNotes(storage.getNotes(groupId));
  }, [groupId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const addOrUpdateNote = (note: LessonNote) => {
    storage.saveNote(note);
    loadNotes();
  };

  const removeNote = (noteId: string) => {
    storage.deleteNote(noteId);
    loadNotes();
  };

  const getNotesForLesson = (subject: string, dayIndex: number, time: string) => {
    return notes.filter(
      (n) => n.subject === subject && n.dayIndex === dayIndex && n.time === time
    );
  };

  return {
    notes,
    addOrUpdateNote,
    removeNote,
    getNotesForLesson,
    refreshNotes: loadNotes,
  };
}
