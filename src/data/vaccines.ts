/**
 * Simplified schedule based on India's Universal Immunisation Programme (UIP).
 * Informational only — the child's doctor / health worker decides the actual schedule.
 */
export interface Vaccine {
  id: string;
  name: string;
  /** Recommended age in weeks from birth. */
  ageWeeks: number;
  dose: string;
  why: string;
  ifMissed: string;
}

export const VACCINES: Vaccine[] = [
  {
    id: 'bcg',
    name: 'BCG',
    ageWeeks: 0,
    dose: 'Single dose, skin (intradermal)',
    why: 'Protects newborns from severe forms of tuberculosis.',
    ifMissed: 'Baby stays at higher risk of serious TB, such as TB meningitis.',
  },
  {
    id: 'opv0',
    name: 'OPV 0 (Polio drops)',
    ageWeeks: 0,
    dose: 'Birth dose, oral drops',
    why: 'Starts protection against polio.',
    ifMissed: 'Polio can cause lifelong paralysis; later doses may not fully make up.',
  },
  {
    id: 'hepb0',
    name: 'Hepatitis B (birth dose)',
    ageWeeks: 0,
    dose: 'Within 24 hours of birth, injection',
    why: 'Prevents hepatitis B passing from mother to baby and protects the liver.',
    ifMissed: 'Higher chance of chronic liver infection later in life.',
  },
  {
    id: 'penta1',
    name: 'Pentavalent 1',
    ageWeeks: 6,
    dose: 'Injection (DPT + Hep B + Hib)',
    why: 'Protects against diphtheria, whooping cough, tetanus, hepatitis B and Hib infections.',
    ifMissed: 'Baby is exposed to dangerous infections like whooping cough and pneumonia.',
  },
  {
    id: 'opv1',
    name: 'OPV 1',
    ageWeeks: 6,
    dose: 'Oral drops',
    why: 'Builds polio immunity.',
    ifMissed: 'Weaker protection against polio.',
  },
  {
    id: 'rota1',
    name: 'Rotavirus 1',
    ageWeeks: 6,
    dose: 'Oral drops',
    why: 'Prevents severe diarrhoea and dehydration in babies.',
    ifMissed: 'Higher risk of hospital stays for severe diarrhoea.',
  },
  {
    id: 'pcv1',
    name: 'PCV 1',
    ageWeeks: 6,
    dose: 'Injection',
    why: 'Protects against pneumococcal pneumonia and meningitis.',
    ifMissed: 'Higher risk of serious pneumonia and brain-fever infections.',
  },
  {
    id: 'ipv1',
    name: 'fIPV 1',
    ageWeeks: 6,
    dose: 'Small injection',
    why: 'Adds injectable polio protection.',
    ifMissed: 'Reduced protection against polio.',
  },
  {
    id: 'penta2',
    name: 'Pentavalent 2',
    ageWeeks: 10,
    dose: 'Injection',
    why: 'Second dose builds stronger protection.',
    ifMissed: 'Protection stays incomplete.',
  },
  {
    id: 'opv2',
    name: 'OPV 2',
    ageWeeks: 10,
    dose: 'Oral drops',
    why: 'Second polio dose.',
    ifMissed: 'Weaker polio protection.',
  },
  {
    id: 'rota2',
    name: 'Rotavirus 2',
    ageWeeks: 10,
    dose: 'Oral drops',
    why: 'Second dose against severe diarrhoea.',
    ifMissed: 'Reduced protection against rotavirus.',
  },
  {
    id: 'penta3',
    name: 'Pentavalent 3',
    ageWeeks: 14,
    dose: 'Injection',
    why: 'Completes the primary series.',
    ifMissed: 'Child remains only partly protected.',
  },
  {
    id: 'opv3',
    name: 'OPV 3',
    ageWeeks: 14,
    dose: 'Oral drops',
    why: 'Third polio dose.',
    ifMissed: 'Weaker polio protection.',
  },
  {
    id: 'rota3',
    name: 'Rotavirus 3',
    ageWeeks: 14,
    dose: 'Oral drops',
    why: 'Completes rotavirus protection.',
    ifMissed: 'Reduced protection against rotavirus.',
  },
  {
    id: 'ipv2',
    name: 'fIPV 2',
    ageWeeks: 14,
    dose: 'Small injection',
    why: 'Second injectable polio dose.',
    ifMissed: 'Reduced protection against polio.',
  },
  {
    id: 'pcv2',
    name: 'PCV 2',
    ageWeeks: 14,
    dose: 'Injection',
    why: 'Second dose against pneumococcal disease.',
    ifMissed: 'Protection stays incomplete.',
  },
  {
    id: 'mr1',
    name: 'Measles-Rubella (MR) 1',
    ageWeeks: 39,
    dose: 'Injection at 9 months',
    why: 'Protects against measles and rubella.',
    ifMissed: 'Measles can cause pneumonia, brain swelling and death in young children.',
  },
  {
    id: 'ipv3',
    name: 'fIPV 3',
    ageWeeks: 39,
    dose: 'Small injection',
    why: 'Third injectable polio dose.',
    ifMissed: 'Reduced protection against polio.',
  },
  {
    id: 'pcvb',
    name: 'PCV booster',
    ageWeeks: 39,
    dose: 'Injection',
    why: 'Boosts protection against pneumococcal disease.',
    ifMissed: 'Protection may fade.',
  },
  {
    id: 'vita1',
    name: 'Vitamin A (1st dose)',
    ageWeeks: 39,
    dose: 'Oral liquid',
    why: 'Supports eyesight and immunity.',
    ifMissed: 'Higher risk of night blindness and infections.',
  },
  {
    id: 'mr2',
    name: 'Measles-Rubella (MR) 2',
    ageWeeks: 69,
    dose: 'Injection at 16–24 months',
    why: 'Second dose for lasting protection.',
    ifMissed: 'Some children stay unprotected after the first dose.',
  },
  {
    id: 'dptb1',
    name: 'DPT booster 1',
    ageWeeks: 69,
    dose: 'Injection at 16–24 months',
    why: 'Keeps protection against diphtheria, whooping cough and tetanus strong.',
    ifMissed: 'Protection weakens over time.',
  },
  {
    id: 'opvb',
    name: 'OPV booster',
    ageWeeks: 69,
    dose: 'Oral drops',
    why: 'Boosts polio immunity.',
    ifMissed: 'Weaker long-term polio protection.',
  },
  {
    id: 'dptb2',
    name: 'DPT booster 2',
    ageWeeks: 260,
    dose: 'Injection at 5–6 years',
    why: 'Renews protection before and during school years.',
    ifMissed: 'Child may be vulnerable to diphtheria and tetanus.',
  },
  {
    id: 'td10',
    name: 'Td (Tetanus-diphtheria)',
    ageWeeks: 520,
    dose: 'Injection at 10 years',
    why: 'Renews tetanus and diphtheria protection.',
    ifMissed: 'Reduced protection against tetanus.',
  },
  {
    id: 'td16',
    name: 'Td (Tetanus-diphtheria)',
    ageWeeks: 832,
    dose: 'Injection at 16 years',
    why: 'Final school-age booster.',
    ifMissed: 'Reduced protection against tetanus.',
  },
];

export const VACCINE_BY_ID: Record<string, Vaccine> = Object.fromEntries(
  VACCINES.map((v) => [v.id, v]),
);
