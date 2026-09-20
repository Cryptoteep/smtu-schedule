export type WeekParity = 'up' | 'down' | 'both';

export type LessonType = 'lecture' | 'practice' | 'lab' | 'military' | 'exam' | 'other';

export interface TeacherInfo {
  name: string;
  id?: string;
  photoUrl?: string;
  profileUrl?: string;
}

export interface Lesson {
  id: string;
  dayIndex?: number;
  time: string;
  timeSlotIndex: number;
  subject: string;
  type: LessonType;
  rawType: string;
  room: string;
  campus: string;
  groupName: string;
  weekParity: WeekParity;
  dateSpecific?: string;
  dateRange?: string;
  exactDates?: string[];
  note?: string;
  teacher?: TeacherInfo;
}

export interface DaySchedule {
  dayName: string;
  dayIndex: number; // 1 = Monday, ..., 6 = Saturday, 0 = Sunday
  lessons: Lesson[];
}

export interface GroupSchedule {
  groupId: string;
  groupName: string;
  facultyName?: string;
  updatedAt: string;
  days: DaySchedule[];
}

export interface GroupItem {
  id: string;
  name: string;
  course?: number;
}

export interface Faculty {
  faculty: string;
  shortName: string;
  groupsCount: number;
  groups: GroupItem[];
}

export interface TeacherItem {
  id: string;
  name: string;
  photoUrl?: string;
  profileUrl?: string;
  totalLessons?: number;
}

export interface TeacherSchedule {
  teacherId: string;
  teacherName: string;
  photoUrl?: string;
  profileUrl?: string;
  updatedAt: string;
  totalLessons: number;
  days: DaySchedule[];
}

export type ScheduleMode = 'group' | 'teacher';

export interface LessonNote {
  id: string;
  groupId: string;
  subject: string;
  dayIndex: number;
  time: string;
  text: string;
  deadline?: string;
  completed?: boolean;
  createdAt: string;
}

export interface CampusInfo {
  letter: string;
  name: string;
  fullName: string;
  address: string;
  metro: string;
  description: string;
  mapsUrl: string;
}

export type ViewWeekFilter = 'current' | 'up' | 'down' | 'all';
