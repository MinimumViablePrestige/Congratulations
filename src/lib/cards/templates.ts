export type CardTemplateId =
  | "warm-classic"
  | "team-modern"
  | "bright-celebration"
  | "gentle-personal";

export type OccasionId =
  | "personal"
  | "team"
  | "celebration"
  | "teacher"
  | "caregiver"
  | "colleague";

export type CardTemplate = {
  id: CardTemplateId;
  name: string;
  description: string;
  recommendedFor: OccasionId[];
  accent: string;
};

export const cardTemplates: CardTemplate[] = [
  {
    id: "warm-classic",
    name: "Теплый классический",
    description: "Спокойный и уважительный стиль для душевной открытки без лишнего шума.",
    recommendedFor: ["personal", "teacher", "caregiver"],
    accent: "#bf6c47"
  },
  {
    id: "team-modern",
    name: "Командный современный",
    description: "Чистый и собранный стиль, когда открытку делает команда, класс или группа.",
    recommendedFor: ["team", "colleague"],
    accent: "#27566b"
  },
  {
    id: "bright-celebration",
    name: "Праздничный яркий",
    description: "Более заметный и эффектный вариант для дней рождения, юбилеев и громких поводов.",
    recommendedFor: ["celebration", "teacher", "colleague"],
    accent: "#fb8500"
  },
  {
    id: "gentle-personal",
    name: "Нежный личный",
    description: "Мягкий визуальный тон с акцентом на личность получателя и теплые детали.",
    recommendedFor: ["personal", "caregiver", "teacher"],
    accent: "#b97c73"
  }
];

export const occasions = [
  { id: "personal", label: "Личная и теплая" },
  { id: "team", label: "От команды или группы" },
  { id: "celebration", label: "Яркая праздничная" }
] as const satisfies ReadonlyArray<{ id: OccasionId; label: string }>;

const legacyOccasions = ["teacher", "caregiver", "colleague"] as const satisfies ReadonlyArray<OccasionId>;

export const isTemplateId = (value: string): value is CardTemplateId =>
  cardTemplates.some((template) => template.id === value);

export const isOccasionId = (value: string): value is OccasionId =>
  occasions.some((occasion) => occasion.id === value) ||
  legacyOccasions.some((occasion) => occasion === value);

export const getDefaultTemplateForOccasion = (occasion: OccasionId): CardTemplateId => {
  if (occasion === "team" || occasion === "colleague") {
    return "team-modern";
  }

  if (occasion === "celebration") {
    return "bright-celebration";
  }

  return "warm-classic";
};
