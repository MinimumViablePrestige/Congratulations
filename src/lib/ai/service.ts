import { randomUUID } from "node:crypto";
import { countAiGenerationsByCardId, saveAiGenerationLog } from "@/lib/ai/repository";
import type { AiGenerationInput, AiGenerationLog, AiGenerationResult, AiStyle } from "@/lib/ai/types";
import { logger } from "@/lib/logger";

const CARD_GENERATION_LIMIT = 50;
type RelationCategory =
  | "student"
  | "parent"
  | "colleague"
  | "friend"
  | "relative"
  | "manager"
  | "recipient_role"
  | "general";

const cleanText = (value: string) =>
  value
    .replace(/[!]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

const sanitizeItems = (items: string[]) =>
  items
    .map((item) => cleanText(item).toLowerCase())
    .filter(Boolean)
    .slice(0, 3);

const sanitizeSentence = (value?: string) => {
  const cleaned = cleanText(value ?? "");
  if (!cleaned) {
    return "";
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const relationPrefix = (relation: string, category: RelationCategory) => {
  const cleaned = cleanText(relation).toLowerCase();

  if (!cleaned || category === "recipient_role") {
    return "как человек, который вас очень ценит";
  }

  return `как ${cleaned}`;
};

const relationLower = (relation: string) => cleanText(relation).toLowerCase();

const qualityNounMap: Record<string, string> = {
  добрый: "доброта",
  внимательный: "внимание к людям",
  надежный: "надежность",
  мудрый: "мудрость",
  заботливый: "забота",
  вдохновляющий: "умение вдохновлять"
};

const qualityObjectMap: Record<string, string> = {
  добрый: "доброту",
  внимательный: "внимание к людям",
  надежный: "надежность",
  мудрый: "мудрость",
  заботливый: "заботу",
  вдохновляющий: "умение вдохновлять"
};

const wishPhraseMap: Record<string, string> = {
  здоровья: "крепкого здоровья",
  радости: "радости",
  спокойствия: "спокойствия",
  успехов: "успехов",
  тепла: "тепла",
  "новых возможностей": "новых возможностей"
};

const negativeDetailPatterns = [
  /крич/i,
  /ор[её]/i,
  /руг/i,
  /зл/i,
  /бесит/i,
  /наказывает/i,
  /строг/i,
  /боюсь/i,
  /ненав/i
];

const hashText = (value: string) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
};

const pickBySeed = <T,>(items: T[], seed: number, offset = 0) => items[(seed + offset) % items.length];

const toQualityNouns = (qualities: string[]) =>
  qualities.map((quality) => qualityNounMap[quality] ?? quality).filter(Boolean);

const toQualityObjects = (qualities: string[]) =>
  qualities.map((quality) => qualityObjectMap[quality] ?? quality).filter(Boolean);

const toWishPhrases = (wishes: string[]) => wishes.map((wish) => wishPhraseMap[wish] ?? wish).filter(Boolean);

const normalizePersonalDetail = (value?: string) => {
  const cleaned = sanitizeSentence(value);
  if (!cleaned) {
    return "";
  }

  if (negativeDetailPatterns.some((pattern) => pattern.test(cleaned))) {
    return "";
  }

  return cleaned;
};

const resolveRelationCategory = (relation: string, occasion: AiGenerationInput["occasion"]): RelationCategory => {
  const cleaned = relationLower(relation);

  if (!cleaned) {
    return "general";
  }

  if (cleaned.includes("учен")) {
    return "student";
  }

  if (cleaned.includes("родител")) {
    return "parent";
  }

  if (cleaned.includes("коллег")) {
    return "colleague";
  }

  if (cleaned.includes("друг") || cleaned.includes("подруг")) {
    return "friend";
  }

  if (cleaned.includes("родствен") || cleaned.includes("сест") || cleaned.includes("брат")) {
    return "relative";
  }

  if (cleaned.includes("руковод") || cleaned.includes("началь")) {
    return "manager";
  }

  if (
    (occasion === "teacher" && cleaned.includes("учител")) ||
    (occasion === "caregiver" && cleaned.includes("воспит")) ||
    (occasion === "colleague" && cleaned.includes("коллег"))
  ) {
    return "recipient_role";
  }

  return "general";
};

const buildOpening = (
  occasion: AiGenerationInput["occasion"],
  relation: string,
  relationCategory: RelationCategory,
  recipientName: string,
  seed: number
) => {
  const relationText = relationLower(relation);

  if (occasion === "teacher") {
    if (relationCategory === "student") {
      return pickBySeed([
        `${recipientName}, хочу поблагодарить вас за знания, терпение и поддержку.`,
        `${recipientName}, спасибо вам за уроки, внимание и тот вклад, который вы делаете каждый день.`
      ], seed);
    }

    if (relationCategory === "parent") {
      return pickBySeed([
        `${recipientName}, от души спасибо вам за труд, терпение и внимание к детям.`,
        `${recipientName}, хочется поблагодарить вас за ту заботу и вовлеченность, которые чувствуют дети и родители.`
      ], seed);
    }

    return pickBySeed([
      `${recipientName}, спасибо вам за труд, терпение и искреннее участие в жизни детей.`,
      `${recipientName}, хочется поздравить вас и поблагодарить за ту важную работу, которую вы делаете каждый день.`
    ], seed);
  }

  if (occasion === "caregiver") {
    if (relationCategory === "student") {
      return pickBySeed([
        `${recipientName}, с вами рядом всегда чувствуется больше тепла и спокойствия.`,
        `${recipientName}, хочется сказать вам спасибо за заботу и внимание, которые так много значат.`
      ], seed);
    }

    if (relationCategory === "parent") {
      return pickBySeed([
        `${recipientName}, спасибо вам за заботу, тепло и ту атмосферу, в которой детям спокойно и радостно.`,
        `${recipientName}, очень ценю ваше внимание к детям, терпение и искреннюю заботу.`
      ], seed);
    }

    return pickBySeed([
      `${recipientName}, спасибо вам за заботу, тепло и умение быть рядом именно тогда, когда это особенно нужно.`,
      `${recipientName}, хочется поблагодарить вас за внимание, терпение и добрую атмосферу, которую вы создаете.`
    ], seed);
  }

  if (relationCategory === "colleague") {
    return pickBySeed([
      `${recipientName}, рядом с вами особенно ценятся надежность, спокойствие и человеческое тепло.`,
      `${recipientName}, с вами приятно проходить и рабочие задачи, и важные командные моменты.`
    ], seed);
  }

  if (relationCategory === "friend" || relationCategory === "relative") {
    return pickBySeed([
      `${recipientName}, рядом с вами особенно ценятся теплота, искренность и умение поддержать.`,
      `${recipientName}, хочется сказать вам теплые слова и поблагодарить за то добро, которое вы приносите людям рядом.`
    ], seed);
  }

  return pickBySeed([
    `${recipientName}, хочется сказать вам теплые слова и поблагодарить за все хорошее, что вы даете людям рядом.`,
    `${recipientName}, сегодня особенно хочется отметить, сколько тепла и хорошего настроения вы приносите окружающим.`
  ], seed);
};

const buildQualitiesSentence = (qualities: string[], seed: number) => {
  if (qualities.length === 0) {
    return "";
  }

  const joined = joinItems(qualities);
  return pickBySeed([
    `В вас особенно чувствуются ${joined}.`,
    `С вами у многих ассоциируются ${joined}.`,
    `Именно в вас особенно ценят ${joined}.`
  ], seed, 1);
};

const buildDetailSentence = (detail: string, seed: number) => {
  if (!detail) {
    return "";
  }

  const normalized = detail.charAt(0).toLowerCase() + detail.slice(1);
  return pickBySeed([
    `Особенно хочется вспомнить, как ${normalized}.`,
    `И отдельное спасибо за то, что ${normalized}.`
  ], seed, 2);
};

const buildWishSentence = (wishes: string[], seed: number) => {
  const joined = joinItems(wishes);
  return pickBySeed([
    `От души желаю вам ${joined}.`,
    `Пусть впереди у вас будет больше ${joined}.`
  ], seed, 3);
};

const styleClosers: Record<AiStyle, string> = {
  "warm-simple": "Спасибо вам за то тепло, которое вы дарите людям рядом.",
  "short-no-pathos": "Пусть впереди будет больше спокойных и радостных дней.",
  humor: "И пусть хорошее настроение у вас всегда приходит чуть раньше повседневных забот.",
  touching: "Очень хочется, чтобы вы чувствовали, как много доброго о вас думают.",
  respectful: "Пусть ваше внимание к людям возвращается к вам благодарностью и уважением."
};

const joinItems = (items: string[]) => {
  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} и ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")} и ${items.at(-1)}`;
};

const buildVariants = (input: AiGenerationInput, generationIndex: number) => {
  const cleanedRecipientName = sanitizeSentence(input.recipientName);
  const sanitizedQualities = sanitizeItems(input.qualities);
  const cleanedQualities = toQualityNouns(sanitizedQualities);
  const cleanedQualityObjects = toQualityObjects(sanitizedQualities);
  const cleanedWishes = toWishPhrases(sanitizeItems(input.wishes));
  const cleanedDetail = normalizePersonalDetail(input.personalDetail);
  const relationCategory = resolveRelationCategory(input.relation, input.occasion);
  const cleanedRelation = relationPrefix(input.relation, relationCategory);
  const seed = hashText(
    [
      input.cardId,
      input.recipientName,
      input.relation,
      input.qualities.join("|"),
      input.wishes.join("|"),
      input.personalDetail ?? "",
      input.style,
      String(generationIndex)
    ].join("::")
  );

  const opening = buildOpening(input.occasion, input.relation, relationCategory, cleanedRecipientName, seed);
  const qualitiesSentence = buildQualitiesSentence(cleanedQualities, seed);
  const detailSentence = buildDetailSentence(cleanedDetail, seed);
  const wishSentence = buildWishSentence(cleanedWishes, seed);

  const shortTemplates = [
    `${cleanedRecipientName}, спасибо вам за ${joinItems(cleanedQualityObjects)}. Желаю вам ${joinItems(cleanedWishes)} и много светлых моментов впереди.`,
    `${cleanedRecipientName}, очень хочется поблагодарить вас за ${joinItems(cleanedQualityObjects)}. Пусть впереди будет больше ${joinItems(cleanedWishes)}.`
  ];

  const short = pickBySeed(shortTemplates, seed, 4);

  const heartfelt = [opening, qualitiesSentence, detailSentence, wishSentence, styleClosers[input.style]]
    .filter(Boolean)
    .join(" ");

  const styled = [
    `${cleanedRecipientName}, хочу поздравить вас ${cleanedRelation}.`,
    qualitiesSentence,
    detailSentence,
    wishSentence,
    styleClosers[input.style]
  ]
    .filter(Boolean)
    .join(" ");

  return [
    { id: "short", label: "Короткий вариант", text: short },
    { id: "heartfelt", label: "Душевный вариант", text: heartfelt },
    { id: "styled", label: "В выбранном стиле", text: styled }
  ];
};

export const generateParticipantMessage = async (input: AiGenerationInput): Promise<AiGenerationResult> => {
  const usedCount = await countAiGenerationsByCardId(input.cardId);

  if (usedCount >= CARD_GENERATION_LIMIT) {
    throw new Error("CARD_AI_LIMIT_REACHED");
  }

  const variants = buildVariants(input, usedCount);
  const remainingCardGenerations = CARD_GENERATION_LIMIT - usedCount - 1;

  const logEntry: AiGenerationLog = {
    id: randomUUID(),
    cardId: input.cardId,
    generationType: "participant_message",
    inputJson: JSON.stringify(input),
    outputText: JSON.stringify(variants),
    model: "local-template-v2",
    createdAt: new Date().toISOString()
  };

  await saveAiGenerationLog(logEntry);

  logger.info("ai.participant_generated", "Participant AI draft generated", {
    cardId: input.cardId,
    remainingCardGenerations
  });

  return {
    variants,
    remainingCardGenerations
  };
};
