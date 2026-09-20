/**
 * Life areas. Every stored fact is prefixed with one of these tags
 * (e.g. "[training] Ana runs on Tuesdays"), chosen by the extractor.
 * The UI counts tags per user to show badges; no database needed.
 */
export const AREAS = [
  { id: "training", label: "Training", hint: "exercise, sport, running, gym" },
  { id: "sleep", label: "Sleep", hint: "bedtime, waking up, energy" },
  { id: "food", label: "Food & cooking", hint: "meals, cooking, diet, sugar, coffee" },
  { id: "reading", label: "Reading & study", hint: "books, courses, exams, learning" },
  { id: "focus", label: "Work & focus", hint: "career, procrastination, deep work" },
  { id: "money", label: "Money", hint: "saving, spending, debt, budget" },
  { id: "digital", label: "Digital habits", hint: "phone, screens, social media" },
  { id: "social", label: "Relationships", hint: "family, friends, partner, kids" },
  { id: "creative", label: "Creative & hobbies", hint: "music, writing, art, side projects" },
  { id: "mind", label: "Mind & mood", hint: "stress, anxiety, motivation, mindfulness" },
  { id: "life", label: "Life", hint: "anything else: home, travel, identity, plans" },
] as const;

export type AreaId = (typeof AREAS)[number]["id"];
export const AREA_IDS = AREAS.map((a) => a.id) as readonly string[];
