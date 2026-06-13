import { randomUUID } from "node:crypto";
import { countAiGenerationsByCardId, saveAiGenerationLog } from "@/lib/ai/repository";
import type { AiGenerationInput, AiGenerationLog, AiGenerationResult, AiStyle } from "@/lib/ai/types";
import { logger } from "@/lib/logger";

const CARD_GENERATION_LIMIT = 50;

type RelationCategory = "student" | "parent" | "colleague" | "friend" | "relative" | "manager" | "general";

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

const negativeDetailPatterns = [/крич/i, /ор[её]/i, /руг/i, /зл/i, /бесит/i, /наказыва/i, /строг/i, /боюсь/i, /ненав/i];

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

const resolveRelationCategory = (relation: string): RelationCategory => {
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

  return "general";
};

const relationPrefix = (relation: string, category: RelationCategory) => {
  const cleaned = cleanText(relation).toLowerCase();

  if (!cleaned || category === "general") {
    return "как человек, который вас очень ценит";
  }

  return `как ${cleaned}`;
};

const buildContextTail = (occasionText: string) => {
  const cleaned = cleanText(occasionText);
  if (!cleaned) {
    return "";
  }

  return `Особенно приятно собрать эти слова по поводу ${cleaned.toLowerCase()}.`;
};

const buildOpening = (
  recipientName: string,
  relationCategory: RelationCategory,
  occasionText: string,
  seed: number
) => {
  const context = cleanText(occasionText).toLowerCase();

  if (relationCategory === "student") {
    return pickBySeed(
      [
        `${recipientName}, хочется сказать вам спасибо за тот след, который вы оставляете в людях рядом.`,
        `${recipientName}, в этот день особенно хочется поблагодарить вас за внимание, терпение и человеческое тепло.`
      ],
      seed
    );
  }

  if (relationCategory === "parent") {
    return pickBySeed(
      [
        `${recipientName}, от души хочется поблагодарить вас за заботу, участие и ту атмосферу, которую вы создаете.`,
        `${recipientName}, сегодня особенно хочется сказать вам теплые слова благодарности и уважения.`
      ],
      seed
    );
  }

  if (relationCategory === "colleague" || context.includes("команд")) {
    return pickBySeed(
      [
        `${recipientName}, рядом с вами особенно ценятся надежность, спокойствие и умение поддержать других.`,
        `${recipientName}, с вами приятно проходить и рабочие задачи, и важные общие моменты.`
      ],
      seed
    );
  }

  if (relationCategory === "friend" || relationCategory === "relative") {
    return pickBySeed(
      [
        `${recipientName}, рядом с вами особенно чувствуются искренность, тепло и умение быть рядом вовремя.`,
        `${recipientName}, очень хочется сказать вам теплые слова и поблагодарить за добро, которое вы даете людям рядом.`
      ],
      seed
    );
  }

  return pickBySeed(
    [
      `${recipientName}, сегодня особенно хочется отметить, сколько тепла и хорошего настроения вы приносите окружающим.`,
      `${recipientName}, хочется сказать вам теплые слова и поблагодарить за все хорошее, что вы даете людям рядом.`
    ],
    seed
  );
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

const buildQualitiesSentence = (qualities: string[], seed: number) => {
  if (qualities.length === 0) {
    return "";
  }

  const joined = joinItems(qualities);
  return pickBySeed(
    [
      `В вас особенно чувствуются ${joined}.`,
      `Именно с вами у многих ассоциируются ${joined}.`,
      `Вас ценят именно за ${joined}.`
    ],
    seed,
    1
  );
};

const buildDetailSentence = (detail: string, seed: number) => {
  if (!detail) {
    return "";
  }

  const normalized = detail.charAt(0).toLowerCase() + detail.slice(1);
  return pickBySeed(
    [
      `Особенно хочется вспомнить, как ${normalized}.`,
      `Отдельное спасибо за то, что ${normalized}.`
    ],
    seed,
    2
  );
};

const buildWishSentence = (wishes: string[], seed: number) => {
  const joined = joinItems(wishes);
  return pickBySeed(
    [
      `От души желаю вам ${joined}.`,
      `Пусть впереди у вас будет больше ${joined}.`
    ],
    seed,
    3
  );
};

const styleClosers: Record<AiStyle, string> = {
  "warm-simple": "Спасибо вам за то тепло, которое вы дарите людям рядом.",
  "short-no-pathos": "Пусть впереди будет больше спокойных и радостных дней.",
  humor: "И пусть хорошее настроение у вас всегда приходит чуть раньше повседневных забот.",
  touching: "Очень хочется, чтобы вы чувствовали, как много доброго о вас думают.",
  respectful: "Пусть ваше внимание к людям возвращается к вам благодарностью и уважением."
};

const buildVariants = (input: AiGenerationInput, generationIndex: number) => {
  const cleanedRecipientName = sanitizeSentence(input.recipientName);
  const sanitizedQualities = sanitizeItems(input.qualities);
  const cleanedQualities = toQualityNouns(sanitizedQualities);
  const cleanedQualityObjects = toQualityObjects(sanitizedQualities);
  const cleanedWishes = toWishPhrases(sanitizeItems(input.wishes));
  const cleanedDetail = normalizePersonalDetail(input.personalDetail);
  const relationCategory = resolveRelationCategory(input.relation);
  const cleanedRelation = relationPrefix(input.relation, relationCategory);
  const seed = hashText(
    [
      input.cardId,
      input.recipientName,
      input.occasion,
      input.occasionText,
      input.relation,
      input.qualities.join("|"),
      input.wishes.join("|"),
      input.personalDetail ?? "",
      input.style,
      String(generationIndex)
    ].join("::")
  );

  const opening = buildOpening(cleanedRecipientName, relationCategory, input.occasionText, seed);
  const qualitiesSentence = buildQualitiesSentence(cleanedQualities, seed);
  const detailSentence = buildDetailSentence(cleanedDetail, seed);
  const wishSentence = buildWishSentence(cleanedWishes, seed);
  const contextTail = buildContextTail(input.occasionText);

  const shortTemplates = [
    `${cleanedRecipientName}, спасибо вам за ${joinItems(cleanedQualityObjects)}. Желаю вам ${joinItems(cleanedWishes)} и много светлых моментов впереди.`,
    `${cleanedRecipientName}, очень хочется поблагодарить вас за ${joinItems(cleanedQualityObjects)}. Пусть впереди будет больше ${joinItems(cleanedWishes)}.`
  ];

  const short = pickBySeed(shortTemplates, seed, 4);

  const heartfelt = [opening, qualitiesSentence, detailSentence, wishSentence, contextTail, styleClosers[input.style]]
    .filter(Boolean)
    .join(" ");

  const styled = [
    `${cleanedRecipientName}, хочу поздравить вас ${cleanedRelation}.`,
    qualitiesSentence,
    detailSentence,
    wishSentence,
    contextTail,
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
    model: "local-template-v3",
    createdAt: new Date().toISOString()
  };

  await saveAiGenerationLog(logEntry);

  logger.info("ai.participant_generated", "Participant AI draft generated", {
    cardId: input.cardId,
    occasion: input.occasion,
    remainingCardGenerations
  });

  return {
    variants,
    remainingCardGenerations
  };
};
