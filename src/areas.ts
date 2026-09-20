/**
 * The seven mentors. Every stored fact is prefixed with one of these tags
 * (e.g. "[training] Ana runs on Tuesdays"), chosen by the extractor; `life`
 * is the fallback for anything else. The UI counts tags per user to show
 * badges; no database needed.
 */
export const AREAS = [
  { id: "mind", label: "Mindfulness & Zen", short: "Zen", icon: "self_improvement", hint: "focus, daily meditation, anxiety, stress, sleep hygiene", blurb: "Steady focus, daily meditation, less anxiety, better sleep hygiene. Remembers exactly what caused your last spike of stress." },
  { id: "focus", label: "Work & Career", short: "Work", icon: "work", hint: "productivity, meetings, procrastination, deadlines, career", blurb: "Relentless productivity, meeting prep, sprint deliveries and the one task you keep avoiding. Knows your deadlines." },
  { id: "training", label: "Fitness & Performance", short: "Fitness", icon: "fitness_center", hint: "workouts, running, gym, injuries, mobility, records", blurb: "Training plans, progressive load, mobility routines and the discipline that keeps your past records in mind — injuries included." },
  { id: "reading", label: "Study & Academics", short: "Study", icon: "school", hint: "exams, courses, spaced revision, schedules, learning", blurb: "Exams, courses, spaced revision and study schedules that don't leave subjects behind. Remembers where you got stuck." },
  { id: "pets", label: "Pets & Companionship", short: "Pets", icon: "pets", hint: "training, vaccines, wellbeing, routines for dogs and cats", blurb: "Positive training routines, vaccine dates, wellbeing and socialisation habits for dogs and cats. Knows your pet by name." },
  { id: "creative", label: "Music & Creativity", short: "Music", icon: "music_note", hint: "instrument practice, songwriting, art, creative blocks", blurb: "Instrument practice, songwriting, unblocking creativity and building a repertoire consistently. Tracks what you practised." },
  { id: "food", label: "Cooking & Nutrition", short: "Cooking", icon: "restaurant", hint: "meal prep, recipes, ingredients, diet, sugar, coffee", blurb: "Weekly meal prep, smart ingredient swaps, techniques and a calorie balance tailored to your taste — and your restrictions." },
  { id: "life", label: "Everything else", short: "Life", icon: "auto_awesome", hint: "anything else: home, money, relationships, travel, plans", blurb: "Anything that doesn't fit a mentor — the coach still remembers it." },
] as const;

export type AreaId = (typeof AREAS)[number]["id"];
export const AREA_IDS = AREAS.map((a) => a.id) as readonly string[];
/** The mentors shown as cards (everything except the fallback). */
export const MENTORS = AREAS.filter((a) => a.id !== "life");
