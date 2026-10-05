export interface Activity {
  id: string;
  title: string;
  description: string;
  minMonths: number;
  maxMonths: number;
  materials: string;
  benefit: string;
  /** Advanced motor/skill activities are blocked for babies under 6 months. */
  advancedMotor?: boolean;
}

export const ACTIVITIES: Activity[] = [
  {
    id: 'skin_to_skin',
    title: 'Skin-to-skin cuddle',
    description: 'Hold your baby against your bare chest, covered with a light cloth, and talk softly.',
    minMonths: 0,
    maxMonths: 5,
    materials: 'A soft cloth',
    benefit: 'Builds bonding, steadies breathing and helps feeding.',
  },
  {
    id: 'face_talk',
    title: 'Face-to-face talking',
    description: 'Hold baby 20–30 cm from your face. Smile, make sounds and pause so baby can "reply".',
    minMonths: 0,
    maxMonths: 5,
    materials: 'None',
    benefit: 'Supports eye contact, early language and social smiles.',
  },
  {
    id: 'eye_tracking',
    title: 'Follow the toy',
    description: 'Slowly move a bright rattle or cloth from side to side and let baby follow it with the eyes.',
    minMonths: 1,
    maxMonths: 5,
    materials: 'Colourful rattle or cloth',
    benefit: 'Strengthens eye muscles and focus.',
  },
  {
    id: 'tummy_time',
    title: 'Supervised tummy time',
    description: 'Place baby on their tummy on a firm mat for a few minutes while awake, staying right beside them.',
    minMonths: 1,
    maxMonths: 8,
    materials: 'Firm mat or folded blanket',
    benefit: 'Builds neck, back and shoulder strength.',
  },
  {
    id: 'lullaby',
    title: 'Sing a lullaby',
    description: 'Sing or hum a familiar lullaby in your own language during calm moments or before sleep.',
    minMonths: 0,
    maxMonths: 12,
    materials: 'Your voice',
    benefit: 'Calms baby and strengthens language hearing in your mother tongue.',
  },
  {
    id: 'sensory_touch',
    title: 'Textures to touch',
    description: 'Let baby gently touch soft cloth, a wooden spoon and a smooth steel bowl while you name each one.',
    minMonths: 3,
    maxMonths: 11,
    materials: 'Safe household textures (too large to swallow)',
    benefit: 'Develops the sense of touch and curiosity.',
  },
  {
    id: 'reach_grasp',
    title: 'Reach and grasp',
    description: 'Offer a light rattle or soft ring just within reach so baby practises reaching and grasping.',
    minMonths: 4,
    maxMonths: 9,
    materials: 'Soft rattle or ring',
    benefit: 'Hand-eye coordination and grip.',
    advancedMotor: true,
  },
  {
    id: 'peekaboo',
    title: 'Peek-a-boo',
    description: 'Cover your face with a cloth and reveal it with a smile and "peek-a-boo!".',
    minMonths: 5,
    maxMonths: 14,
    materials: 'Light cloth',
    benefit: 'Teaches object permanence and brings laughter.',
    advancedMotor: true,
  },
  {
    id: 'crawl_course',
    title: 'Crawling path',
    description: 'Lay cushions and a tempting toy a short distance away to encourage crawling.',
    minMonths: 7,
    maxMonths: 14,
    materials: 'Cushions, favourite toy',
    benefit: 'Builds strength and coordination for walking.',
    advancedMotor: true,
  },
  {
    id: 'stack_cups',
    title: 'Stack and nest steel cups',
    description: 'Show how to stack and nest light cups or katoris; let your child knock them down and rebuild.',
    minMonths: 9,
    maxMonths: 24,
    materials: 'Plastic or steel katoris',
    benefit: 'Hand skills, early problem solving.',
    advancedMotor: true,
  },
  {
    id: 'name_things',
    title: 'Name the world',
    description: 'Point at objects at home or on a walk and name them. Repeat; let your child try the sounds.',
    minMonths: 9,
    maxMonths: 30,
    materials: 'Household objects',
    benefit: 'Vocabulary and listening.',
  },
  {
    id: 'water_play',
    title: 'Supervised water pouring',
    description: 'Give a shallow tub and cups for pouring and splashing. Never leave your child alone near water.',
    minMonths: 12,
    maxMonths: 48,
    materials: 'Shallow tub, cups',
    benefit: 'Exploration, fine motor control and concepts like full/empty.',
    advancedMotor: true,
  },
  {
    id: 'rhymes_actions',
    title: 'Rhymes with actions',
    description: 'Sing a rhyme in your language with hand actions and let your child copy.',
    minMonths: 12,
    maxMonths: 60,
    materials: 'None',
    benefit: 'Language, memory and body awareness.',
  },
  {
    id: 'sorting_games',
    title: 'Sort by colour or shape',
    description: 'Sort large blocks, leaves or coloured cloth pieces into groups by colour or shape.',
    minMonths: 24,
    maxMonths: 72,
    materials: 'Large blocks, leaves or coloured cloths',
    benefit: 'Early maths and attention.',
    advancedMotor: true,
  },
  {
    id: 'story_time',
    title: 'Story time',
    description: 'Read or tell a short story together daily. Ask your child what happens next.',
    minMonths: 12,
    maxMonths: 156,
    materials: 'Picture book or your own story',
    benefit: 'Language, imagination and bonding.',
  },
  {
    id: 'kitchen_helper',
    title: 'Little kitchen helper',
    description: 'Let your child wash vegetables, tear greens or stir cold dough under supervision.',
    minMonths: 36,
    maxMonths: 156,
    materials: 'Safe, cold kitchen tasks',
    benefit: 'Independence, counting and healthy-food interest.',
  },
  {
    id: 'outdoor_games',
    title: 'Outdoor traditional games',
    description: 'Play hopscotch, catch, hide-and-seek or kho-kho style running games in a safe space.',
    minMonths: 48,
    maxMonths: 156,
    materials: 'Open safe space',
    benefit: 'Fitness, teamwork and balance.',
    advancedMotor: true,
  },
  {
    id: 'gratitude_chat',
    title: 'Day-end chat',
    description: 'At bedtime, each person shares one happy moment and one thing they learned.',
    minMonths: 60,
    maxMonths: 156,
    materials: 'None',
    benefit: 'Emotional vocabulary and connection.',
  },
];

/** Age-tiered activity filter with the under-6-months safety rule from the original platform. */
export function activitiesForAge(ageMonths: number): Activity[] {
  return ACTIVITIES.filter((a) => {
    if (ageMonths < 6 && a.advancedMotor) return false;
    return ageMonths >= a.minMonths && ageMonths <= a.maxMonths;
  });
}

export interface Milestone {
  id: string;
  title: string;
  typicalMonths: number;
  note: string;
}

/** Typical windows only — every child develops at their own pace. */
export const MILESTONES: Milestone[] = [
  { id: 'smile', title: 'First social smile', typicalMonths: 2, note: 'Usually 6–8 weeks.' },
  { id: 'head', title: 'Holds head steady', typicalMonths: 4, note: 'Around 3–4 months.' },
  { id: 'roll', title: 'Rolls over', typicalMonths: 6, note: 'Around 4–6 months.' },
  { id: 'sit', title: 'Sits without support', typicalMonths: 8, note: 'Around 6–8 months.' },
  { id: 'crawl', title: 'Crawls', typicalMonths: 10, note: 'Around 8–10 months.' },
  { id: 'stand', title: 'Pulls up to stand', typicalMonths: 11, note: 'Around 9–12 months.' },
  { id: 'words', title: 'First words', typicalMonths: 12, note: 'Around 10–14 months.' },
  { id: 'walk', title: 'First steps', typicalMonths: 13, note: 'Around 12–15 months.' },
  { id: 'phrases', title: 'Two-word phrases', typicalMonths: 24, note: 'Around 18–24 months.' },
  { id: 'sentences', title: 'Short sentences', typicalMonths: 36, note: 'Around 2–3 years.' },
];
