import type { Region } from '@/types';

export type FoodTag = 'iron' | 'protein' | 'calcium' | 'vitaminA' | 'energy' | 'fibre';

export interface Food {
  id: string;
  name: string;
  group: 'millet' | 'cereal' | 'pulse' | 'greens' | 'vegetable' | 'fruit' | 'dairy' | 'nuts' | 'nonveg';
  tags: FoodTag[];
  regions: Region[] | 'ALL';
  lowCost: boolean;
  nonVeg?: boolean;
  /** Earliest age (months) to introduce as complementary food. */
  fromMonths: number;
}

const ALL = 'ALL' as const;

export const FOODS: Food[] = [
  { id: 'ragi', name: 'Ragi (finger millet)', group: 'millet', tags: ['calcium', 'iron', 'energy'], regions: ['SOUTH', 'CENTRAL', 'WEST'], lowCost: true, fromMonths: 6 },
  { id: 'bajra', name: 'Bajra (pearl millet)', group: 'millet', tags: ['iron', 'energy', 'fibre'], regions: ['NORTH', 'WEST', 'CENTRAL'], lowCost: true, fromMonths: 8 },
  { id: 'jowar', name: 'Jowar (sorghum)', group: 'millet', tags: ['fibre', 'iron', 'energy'], regions: ['WEST', 'SOUTH', 'CENTRAL'], lowCost: true, fromMonths: 8 },
  { id: 'rice', name: 'Rice', group: 'cereal', tags: ['energy'], regions: ALL, lowCost: true, fromMonths: 6 },
  { id: 'wheat', name: 'Wheat / dalia', group: 'cereal', tags: ['energy', 'fibre'], regions: ['NORTH', 'WEST', 'CENTRAL', 'EAST'], lowCost: true, fromMonths: 8 },
  { id: 'moong', name: 'Moong dal', group: 'pulse', tags: ['protein', 'iron'], regions: ALL, lowCost: true, fromMonths: 6 },
  { id: 'toor', name: 'Toor dal', group: 'pulse', tags: ['protein'], regions: ALL, lowCost: true, fromMonths: 7 },
  { id: 'chana', name: 'Roasted chana / besan', group: 'pulse', tags: ['protein', 'iron', 'fibre'], regions: ['NORTH', 'WEST', 'CENTRAL', 'SOUTH'], lowCost: true, fromMonths: 10 },
  { id: 'rajma', name: 'Rajma / lobia', group: 'pulse', tags: ['protein', 'iron'], regions: ['NORTH', 'CENTRAL'], lowCost: true, fromMonths: 10 },
  { id: 'spinach', name: 'Spinach (palak) / amaranth leaves', group: 'greens', tags: ['iron', 'vitaminA'], regions: ALL, lowCost: true, fromMonths: 6 },
  { id: 'drumstick', name: 'Drumstick leaves & pods', group: 'greens', tags: ['iron', 'calcium', 'vitaminA'], regions: ['SOUTH', 'COASTAL', 'EAST'], lowCost: true, fromMonths: 8 },
  { id: 'methi', name: 'Fenugreek (methi) leaves', group: 'greens', tags: ['iron', 'fibre'], regions: ['NORTH', 'WEST', 'CENTRAL'], lowCost: true, fromMonths: 8 },
  { id: 'carrot', name: 'Carrot / pumpkin', group: 'vegetable', tags: ['vitaminA'], regions: ALL, lowCost: true, fromMonths: 6 },
  { id: 'sweetpotato', name: 'Sweet potato', group: 'vegetable', tags: ['vitaminA', 'energy'], regions: ALL, lowCost: true, fromMonths: 6 },
  { id: 'banana', name: 'Banana', group: 'fruit', tags: ['energy'], regions: ALL, lowCost: true, fromMonths: 6 },
  { id: 'papaya', name: 'Papaya', group: 'fruit', tags: ['vitaminA', 'fibre'], regions: ALL, lowCost: true, fromMonths: 7 },
  { id: 'guava', name: 'Guava', group: 'fruit', tags: ['fibre'], regions: ['NORTH', 'CENTRAL', 'EAST', 'WEST'], lowCost: true, fromMonths: 9 },
  { id: 'curd', name: 'Curd / buttermilk', group: 'dairy', tags: ['calcium', 'protein'], regions: ALL, lowCost: true, fromMonths: 8 },
  { id: 'paneer', name: 'Paneer / milk', group: 'dairy', tags: ['calcium', 'protein'], regions: ['NORTH', 'WEST', 'CENTRAL'], lowCost: false, fromMonths: 9 },
  { id: 'groundnut', name: 'Groundnut / til (ground, no whole nuts)', group: 'nuts', tags: ['protein', 'energy', 'calcium'], regions: ALL, lowCost: true, fromMonths: 9 },
  { id: 'coconut', name: 'Coconut', group: 'nuts', tags: ['energy'], regions: ['SOUTH', 'COASTAL', 'EAST'], lowCost: true, fromMonths: 8 },
  { id: 'egg', name: 'Egg (well cooked)', group: 'nonveg', tags: ['protein', 'iron'], regions: ALL, lowCost: true, nonVeg: true, fromMonths: 8 },
  { id: 'fish', name: 'Fish (boneless, well cooked)', group: 'nonveg', tags: ['protein', 'iron'], regions: ['COASTAL', 'EAST', 'SOUTH'], lowCost: true, nonVeg: true, fromMonths: 9 },
  { id: 'chicken', name: 'Chicken (minced, well cooked)', group: 'nonveg', tags: ['protein', 'iron'], regions: ALL, lowCost: false, nonVeg: true, fromMonths: 9 },
];

export function foodsForRegion(region: Region, nonVeg: boolean, ageMonths: number): Food[] {
  return FOODS.filter(
    (f) =>
      (f.regions === ALL || f.regions.includes(region)) &&
      (nonVeg || !f.nonVeg) &&
      ageMonths >= f.fromMonths,
  );
}

export interface DayPlan {
  day: number;
  meals: { label: 'Morning' | 'Midday' | 'Evening' | 'Night'; text: string }[];
}

function pick<T>(list: T[], i: number): T | undefined {
  return list.length ? list[i % list.length] : undefined;
}

/**
 * Builds a rotating 7-day complementary-feeding plan from locally available foods.
 * Returns [] for babies under 6 months (exclusive breastfeeding).
 */
export function sevenDayPlan(region: Region, nonVeg: boolean, ageMonths: number): DayPlan[] {
  if (ageMonths < 6) return [];
  const foods = foodsForRegion(region, nonVeg, ageMonths);
  const of = (g: Food['group']) => foods.filter((f) => f.group === g);
  const grains = [...of('millet'), ...of('cereal')];
  const protein = [...of('pulse'), ...(nonVeg ? of('nonveg') : []), ...of('dairy')];
  const veg = [...of('greens'), ...of('vegetable')];
  const fruit = of('fruit');
  const energy = [...of('nuts'), ...of('dairy')];

  const style = ageMonths < 9 ? 'mashed' : ageMonths < 12 ? 'soft, finely chopped' : 'family food, soft pieces';
  const plans: DayPlan[] = [];
  for (let d = 0; d < 7; d++) {
    const g = pick(grains, d);
    const g2 = pick(grains, d + 2);
    const p = pick(protein, d);
    const p2 = pick(protein, d + 3);
    const v = pick(veg, d);
    const v2 = pick(veg, d + 1);
    const f = pick(fruit, d);
    const e = pick(energy, d);
    plans.push({
      day: d + 1,
      meals: [
        { label: 'Morning', text: `${g?.name ?? 'Porridge'} porridge with a little ${e?.name ?? 'ghee'} (${style})` },
        { label: 'Midday', text: `${g2?.name ?? 'Rice'} with ${p?.name ?? 'dal'} and ${v?.name ?? 'vegetables'}` },
        { label: 'Evening', text: `${f?.name ?? 'Seasonal fruit'}, mashed or sliced thin` },
        { label: 'Night', text: `Khichdi-style ${p2?.name ?? 'dal'} with ${v2?.name ?? 'vegetables'}` },
      ],
    });
  }
  return plans;
}

export type RecoveryMeal = { breakfast: string; lunch: string; snack: string; dinner: string };

/** Traditional, gentle postpartum meals by region. Rotates by postpartum day. */
export const RECOVERY_MEALS: Record<Region, { veg: RecoveryMeal[]; nonVegLunch: string[] }> = {
  NORTH: {
    veg: [
      { breakfast: 'Warm milk with turmeric and dalia porridge', lunch: 'Moong dal, ghee roti and lauki sabzi', snack: 'Panjiri (a small portion)', dinner: 'Light khichdi with ghee and jeera water' },
      { breakfast: 'Vegetable besan chilla with curd', lunch: 'Palak dal, roti and cooked carrots', snack: 'Roasted makhana', dinner: 'Dalia vegetable soup' },
      { breakfast: 'Oats-free sooji upma with vegetables', lunch: 'Rajma-free dal, rice and methi sabzi', snack: 'Gond ladoo (a small portion)', dinner: 'Moong dal soup with a soft roti' },
    ],
    nonVegLunch: ['Light chicken stew with roti', 'Egg curry (well cooked) with rice', 'Chicken soup with vegetables and roti'],
  },
  SOUTH: {
    veg: [
      { breakfast: 'Ragi malt with jaggery', lunch: 'Rice, pepper rasam and drumstick sambar', snack: 'Steamed sundal (boiled chana)', dinner: 'Idli with mild sambar' },
      { breakfast: 'Pesarattu (moong dosa) with ginger chutney', lunch: 'Rice, garlic-cumin dal and keerai poriyal', snack: 'Dates and a warm glass of milk', dinner: 'Ven pongal with ghee' },
      { breakfast: 'Ragi dosa with coconut chutney', lunch: 'Curd rice with cooked vegetables', snack: 'Roasted groundnut-jaggery chikki', dinner: 'Vegetable kanji (rice porridge)' },
    ],
    nonVegLunch: ['Pepper chicken soup with rice', 'Fish curry (mild, boneless) with rice', 'Egg pepper curry with rice'],
  },
  WEST: {
    veg: [
      { breakfast: 'Sheera (sooji halwa) in small portion with warm milk', lunch: 'Bajra roti with ghee, moong dal and bhaji', snack: 'Roasted til-jaggery ladoo', dinner: 'Mild vegetable khichdi' },
      { breakfast: 'Thalipeeth with curd', lunch: 'Jowar bhakri, varan (dal) and methi sabzi', snack: 'Fruit with dry fruit powder', dinner: 'Dal-rice with ghee' },
      { breakfast: 'Poha with peanuts and vegetables', lunch: 'Kadhi, rice and steamed vegetables', snack: 'Coconut-jaggery laddu', dinner: 'Soft moong dal khichdi' },
    ],
    nonVegLunch: ['Light fish curry with rice', 'Egg bhurji with bhakri', 'Chicken soup with bhakri'],
  },
  EAST: {
    veg: [
      { breakfast: 'Rice porridge with jaggery and milk', lunch: 'Rice, moong dal, lau (bottle gourd) ghanto', snack: 'Puffed rice (muri) with groundnut', dinner: 'Light khichuri' },
      { breakfast: 'Poha with curd and fruit', lunch: 'Rice, masoor dal and saag bhaja', snack: 'Banana with warm milk', dinner: 'Vegetable stew with rice' },
      { breakfast: 'Chira (flattened rice) with milk and banana', lunch: 'Rice, dalma and pumpkin curry', snack: 'Roasted chana', dinner: 'Dal soup with rice' },
    ],
    nonVegLunch: ['Light rohu fish jhol with rice', 'Egg curry with rice', 'Chicken stew with rice'],
  },
  CENTRAL: {
    veg: [
      { breakfast: 'Daliya with milk and jaggery', lunch: 'Jowar roti, moong dal and lauki', snack: 'Roasted chana with jaggery', dinner: 'Dal-rice with ghee' },
      { breakfast: 'Poha with sprouted moong', lunch: 'Roti, palak dal and carrot sabzi', snack: 'Til-jaggery ladoo', dinner: 'Vegetable khichdi' },
      { breakfast: 'Besan chilla with curd', lunch: 'Bajra roti, kadhi and steamed greens', snack: 'Seasonal fruit', dinner: 'Light dal soup with roti' },
    ],
    nonVegLunch: ['Chicken soup with roti', 'Egg curry with roti', 'Mild fish curry with rice'],
  },
  COASTAL: {
    veg: [
      { breakfast: 'Rice kanji with coconut and jaggery', lunch: 'Rice, dal and drumstick-coconut curry', snack: 'Banana and warm milk', dinner: 'Soft idli or neer dosa with mild chutney' },
      { breakfast: 'Ragi porridge with coconut milk', lunch: 'Rice, moong dal and spinach thoran', snack: 'Roasted groundnut with jaggery', dinner: 'Vegetable stew with appam' },
      { breakfast: 'Puttu with banana', lunch: 'Rice, sambar and cabbage thoran', snack: 'Dates and nuts (finely ground)', dinner: 'Light rice porridge with dal' },
    ],
    nonVegLunch: ['Mild coconut fish curry with rice', 'Egg roast (mild) with rice', 'Chicken stew with appam'],
  },
};

export function recoveryMealFor(region: Region, nonVeg: boolean, postpartumDay: number): RecoveryMeal {
  const set = RECOVERY_MEALS[region];
  const i = Math.max(0, postpartumDay) % set.veg.length;
  const base = set.veg[i];
  return nonVeg ? { ...base, lunch: set.nonVegLunch[i % set.nonVegLunch.length] } : base;
}
