export type Lang = 'en' | 'hi' | 'kn' | 'te' | 'ta';
export type Region = 'NORTH' | 'SOUTH' | 'WEST' | 'EAST' | 'CENTRAL' | 'COASTAL';
export type ThemePref = 'system' | 'light' | 'dark';
export type Mood = 'great' | 'good' | 'tired' | 'overwhelmed';

export interface Account {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
}

export interface MotherProfile {
  deliveryDate: string; // YYYY-MM-DD
  deliveryType: 'normal' | 'c-section';
  diet: 'veg' | 'non-veg';
  allergies: string;
}

export interface RecoveryMetric {
  id: string;
  recordedAt: string; // ISO
  weightKg?: number;
  systolic?: number;
  diastolic?: number;
  symptoms: string[];
}

export interface MoodLog {
  id: string;
  date: string; // YYYY-MM-DD (one per day)
  mood: Mood;
  exerciseDone: boolean;
  affirmationDone: boolean;
  hydrationGlasses: number;
  sleepHours: number;
  notes: string;
}

export interface Screening {
  id: string;
  date: string;
  score: number; // PHQ-2, 0-6
}

export interface Child {
  id: string;
  name: string;
  dob: string; // YYYY-MM-DD
  gender: 'M' | 'F' | 'O';
  birthWeightKg?: number;
  createdAt: string;
}

export interface GrowthRecord {
  id: string;
  childId: string;
  date: string;
  weightKg: number;
  heightCm: number;
  headCm?: number;
}

export interface VaccinationEntry {
  id: string;
  childId: string;
  vaccineId: string;
  dueDate: string;
  administeredDate?: string;
  notificationIds?: string[];
}

export interface ActivityCompletion {
  id: string;
  childId: string;
  activityId: string;
  date: string;
  note: string;
}

export interface InboxItem {
  id: string;
  title: string;
  message: string;
  urgent: boolean;
  read: boolean;
  createdAt: string;
}

export interface Settings {
  language: Lang;
  region: Region;
  appLock: boolean;
  remindersEnabled: boolean;
  theme: ThemePref;
}

export interface DataState {
  account?: Account;
  mother?: MotherProfile;
  onboardingDone: boolean;
  metrics: RecoveryMetric[];
  moods: MoodLog[];
  screenings: Screening[];
  children: Child[];
  growth: GrowthRecord[];
  vaccinations: VaccinationEntry[];
  completions: ActivityCompletion[];
  inbox: InboxItem[];
  settings: Settings;
}
