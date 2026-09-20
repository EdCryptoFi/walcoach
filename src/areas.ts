/**
 * The seven mentors. Every stored fact is prefixed with one of these tags
 * (e.g. "[training] Ana runs on Tuesdays"), chosen by the extractor; `life`
 * is the fallback for anything else. The UI counts tags per user to show
 * badges; no database needed.
 */
/** How each mentor talks when "character voice" is on. Neutral voice ignores this. */
export const VOICES: Record<string, string> = {
  mind: `Calm, unhurried, grounded. Short sentences, occasional pauses ("Take a breath."). Notices tension in how the user writes and names it gently. Never preachy; one small practice at a time.`,
  focus: `Crisp executive coach. Structured, time-boxed, bias for action. Uses words like priority, deadline, first step, block of time. Asks for one deliverable, not a list. Warm but no fluff.`,
  training: `Energetic gym coach. Direct, punchy, encouraging ("Let's go.", "Good work."). Talks in sets, sessions, recovery. Celebrates consistency over intensity; firm about injuries and rest.`,
  reading: `Patient tutor. Curious, methodical, asks what the user already knows before explaining. Uses study vocabulary: revision, recall, spaced practice, mock exam. Praises effort, corrects gently.`,
  pets: `Kind, playful animal-lover. Refers to the pet by name whenever known, treats the pet as a family member. Practical about routines, vaccines and training; light humour.`,
  creative: `Relaxed, artistic, a bit poetic. Talks about practice like play, rhythm, small daily reps. Encourages messy first drafts; uses musical or creative metaphors sparingly.`,
  food: `Enthusiastic chef. Sensory, concrete ("smell", "texture", "15 minutes"), practical about prep and swaps. Loves a simple recipe; respects restrictions and budget; never moralises about food.`,
  life: ``,
};

/** Three conversation starters per mentor, shown as chips. */
export const STARTERS: Record<string, string[]> = {
  mind: ["I get stressed and don't really have a way to deal with it.", "My mind races at night and I can't switch off.", "I want to start meditating but I never keep it up."],
  focus: ["I procrastinate on the one task that actually matters at work.", "I have a big presentation next week and I'm avoiding preparing.", "My days disappear into meetings and Slack, help me protect focus time."],
  training: ["I want to start running but I've never managed to stick with it.", "I train hard for two weeks and then drop it. Why?", "I have an old knee injury, how do I get back to exercise safely?"],
  reading: ["I have an exam coming up and I keep leaving subjects behind.", "I read a chapter and forget it the next day.", "Help me build a study schedule I can actually follow."],
  pets: ["I just adopted a puppy and I want to get the routine right.", "My cat scratches the sofa, what can I do?", "Help me keep track of vaccines and vet visits."],
  creative: ["I've been meaning to practise guitar again and never do.", "I want to write songs but I never finish one.", "I lose creative momentum after a few days, how do I keep it?"],
  food: ["I want to cook at home more instead of ordering in.", "Plan a simple week of meals I can prep on Sunday.", "I'm trying to cut sugar, what do I swap in my coffee and snacks?"],
  life: ["Something's on my mind that doesn't fit a category.", "I want to save some money every month and never do.", "I want to call my family more often."],
};

export const AREAS = [
  { id: "mind", label: "Mindfulness & Zen", short: "Zen", icon: "self_improvement", hint: "focus, daily meditation, anxiety, stress, sleep hygiene", blurb: "Steady focus, daily meditation, less anxiety, better sleep hygiene. Remembers exactly what caused your last spike of stress." },
  { id: "focus", label: "Work & Career", short: "Work", icon: "work", hint: "productivity, meetings, procrastination, deadlines, career", blurb: "Relentless productivity, meeting prep, sprint deliveries and the one task you keep avoiding. Knows your deadlines." },
  { id: "training", label: "Fitness & Performance", short: "Fitness", icon: "fitness_center", hint: "workouts, running, gym, injuries, mobility, records", blurb: "Training plans, progressive load, mobility routines and the discipline that keeps your past records in mind, injuries included." },
  { id: "reading", label: "Study & Academics", short: "Study", icon: "school", hint: "exams, courses, spaced revision, schedules, learning", blurb: "Exams, courses, spaced revision and study schedules that don't leave subjects behind. Remembers where you got stuck." },
  { id: "pets", label: "Pets & Companionship", short: "Pets", icon: "pets", hint: "training, vaccines, wellbeing, routines for dogs and cats", blurb: "Positive training routines, vaccine dates, wellbeing and socialisation habits for dogs and cats. Knows your pet by name." },
  { id: "creative", label: "Music & Creativity", short: "Music", icon: "music_note", hint: "instrument practice, songwriting, art, creative blocks", blurb: "Instrument practice, songwriting, unblocking creativity and building a repertoire consistently. Tracks what you practised." },
  { id: "food", label: "Cooking & Nutrition", short: "Cooking", icon: "restaurant", hint: "meal prep, recipes, ingredients, diet, sugar, coffee", blurb: "Weekly meal prep, smart ingredient swaps, techniques and a calorie balance tailored to your taste, and your restrictions." },
  { id: "life", label: "Everything else", short: "Life", icon: "auto_awesome", hint: "anything else: home, money, relationships, travel, plans", blurb: "Anything that doesn't fit a mentor, the coach still remembers it." },
] as const;

export type AreaId = (typeof AREAS)[number]["id"];
export const AREA_IDS = AREAS.map((a) => a.id) as readonly string[];
/** The mentors shown as cards (everything except the fallback). */
export const MENTORS = AREAS.filter((a) => a.id !== "life");
