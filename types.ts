
export enum Language {
  AR = 'ar',
  EN = 'en'
}

export enum KGLevel {
  KG1 = 'KG1',
  KG2 = 'KG2'
}

export interface Theme {
  id: string;
  title: { ar: string; en: string };
  chapters: Chapter[];
  color: string;
}

export interface Chapter {
  id: string;
  title: { ar: string; en: string };
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  type: 'story' | 'activity' | 'experiment';
}

export interface AppState {
  language: Language;
  level: KGLevel | null;
  currentTheme: Theme | null;
  currentLesson: Lesson | null;
  step: 'welcome' | 'level_select' | 'curriculum' | 'lesson';
}
