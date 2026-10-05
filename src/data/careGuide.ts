export interface CareWeek {
  fromWeek: number;
  toWeek: number;
  title: string;
  care: string;
  exercise: string;
  exerciseCSection: string;
  mind: string;
}

export const CARE_GUIDE: CareWeek[] = [
  {
    fromWeek: 1,
    toWeek: 1,
    title: 'Week 1 — Rest and bond',
    care: 'Rest whenever the baby sleeps. Drink water often, eat warm light meals and keep stitches clean and dry. Expect some bleeding that slowly lightens.',
    exercise: 'Deep belly breathing and ankle circles in bed. Short slow walks inside the house.',
    exerciseCSection: 'Deep breathing and ankle pumps in bed. Support your wound with a pillow when coughing or standing. Do not lift anything heavier than your baby.',
    mind: 'Mood swings in the first days are common. Ask family for help with cooking and chores.',
  },
  {
    fromWeek: 2,
    toWeek: 2,
    title: 'Week 2 — Find a rhythm',
    care: 'Feed on demand and sleep in short blocks. Eat iron-rich foods like greens, dal and jaggery. Watch for fever or foul-smelling discharge.',
    exercise: 'Gentle walking for 5–10 minutes, a few times a day. Pelvic floor squeezes if comfortable.',
    exerciseCSection: 'Short slow walks only. No twisting, bending or abdominal exercises.',
    mind: 'Sleep is broken for everyone. Accept help and lower your expectations of the house.',
  },
  {
    fromWeek: 3,
    toWeek: 4,
    title: 'Weeks 3–4 — Building strength',
    care: 'Keep eating well and staying hydrated. Take iron and calcium supplements if your doctor advised them. Sit with good back support while feeding.',
    exercise: 'Walk 10–15 minutes, shoulder rolls, gentle neck stretches and pelvic floor exercises.',
    exerciseCSection: 'Slow walking and gentle shoulder and neck stretches. Wait for your doctor’s review before any core work.',
    mind: 'Talk about how you feel with someone you trust. Even 10 minutes of quiet helps.',
  },
  {
    fromWeek: 5,
    toWeek: 6,
    title: 'Weeks 5–6 — Check-up time',
    care: 'Your 6-week check-up is important: review bleeding, stitches or wound, blood pressure, mood and family planning with your doctor.',
    exercise: 'Walk 15–20 minutes at an easy pace. Add light arm and leg stretches.',
    exerciseCSection: 'Continue easy walking. Ask at your check-up when it is safe to start core exercises.',
    mind: 'If sadness, worry or sleeplessness continues beyond two weeks, tell your doctor.',
  },
  {
    fromWeek: 7,
    toWeek: 12,
    title: 'Weeks 7–12 — Steady recovery',
    care: 'Keep up nutritious meals, hydration and rest. Continue the first 90 days as a healing period; avoid heavy lifting and strenuous work.',
    exercise: 'Walk 20 minutes daily, light stretching, pelvic floor work and gentle yoga breathing.',
    exerciseCSection: 'If your doctor has cleared you, add gentle stretching. Avoid crunches and heavy lifting until fully cleared.',
    mind: 'Make time for one small thing you enjoy every day, such as music or a chat with a friend.',
  },
  {
    fromWeek: 13,
    toWeek: 520,
    title: 'After 90 days — Moving more',
    care: 'Slowly return to normal activity. Keep eating a balanced diet and sleeping when you can. Continue regular check-ups.',
    exercise: 'Brisk walking 30 minutes, low-impact exercise, stretching and light strength work. Stop if you feel pain or heavy bleeding.',
    exerciseCSection: 'Build up slowly with walking and stretching. Add core strengthening only with your doctor’s approval.',
    mind: 'Join a mothers’ group or speak with your ASHA worker if you feel isolated.',
  },
];

export function careWeekFor(postpartumDay: number): CareWeek {
  const week = Math.max(1, Math.ceil((postpartumDay + 1) / 7));
  return CARE_GUIDE.find((g) => week >= g.fromWeek && week <= g.toWeek) ?? CARE_GUIDE[CARE_GUIDE.length - 1];
}

export const AFFIRMATIONS = [
  'I am doing my best, and my best is enough.',
  'My body did something remarkable. It deserves rest.',
  'It is okay to ask for help.',
  'Every small moment of care matters to my baby.',
  'I am learning, and I am allowed to take it slowly.',
  'Taking care of myself helps me take care of my baby.',
  'This tiredness is temporary; my love is lasting.',
];

export const SYMPTOM_OPTIONS = [
  'Heavy bleeding',
  'Fever',
  'Severe headache',
  'Blurred vision',
  'Breast pain',
  'Wound pain or discharge',
  'Swollen legs',
  'Low mood',
  'Trouble sleeping',
];

/** Symptoms that should prompt an urgent medical warning. */
export const URGENT_SYMPTOMS = ['Heavy bleeding', 'Fever', 'Severe headache', 'Blurred vision'];
