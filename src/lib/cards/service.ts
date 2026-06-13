import { randomBytes, randomUUID } from "node:crypto";
import { logger } from "@/lib/logger";
import { saveCardDraft, saveContribution } from "@/lib/cards/repository";
import type {
  CreateCardInput,
  CreateCardResult,
  CardDraft,
  CreateContributionInput,
  Contribution
} from "@/lib/cards/types";

const slug = (size = 8) => randomBytes(size).toString("hex");

export const createCardDraft = async (input: CreateCardInput): Promise<CreateCardResult> => {
  const now = new Date().toISOString();

  const card: CardDraft = {
    id: randomUUID(),
    publicSlug: slug(5),
    manageToken: slug(16),
    finalSlug: slug(6),
    recipientName: input.recipientName,
    occasion: input.occasion,
    occasionText: input.occasionText,
    fromLabel: input.fromLabel,
    organizerName: input.organizerName,
    organizerEmail: input.organizerEmail,
    eventDate: input.eventDate ?? null,
    description: input.description ?? null,
    templateId: input.templateId,
    status: "draft",
    paymentStatus: "unpaid",
    createdAt: now,
    updatedAt: now
  };

  await saveCardDraft(card);

  logger.info("funnel.card_created", "Card draft created", {
    cardId: card.id,
    occasion: card.occasion,
    occasionText: card.occasionText,
    templateId: card.templateId,
    organizerEmail: card.organizerEmail
  });

  const participantLink = `/card/${card.publicSlug}`;
  const manageLink = `/manage/${card.manageToken}`;
  const finalLink = `/gift/${card.finalSlug}`;
  const chatMessage = `Друзья, собираем открытку для ${card.recipientName}. Повод: ${card.occasionText}. Перейдите по ссылке и напишите пару теплых слов, это займет минуту: ${participantLink}`;

  return {
    card,
    participantLink,
    manageLink,
    finalLink,
    chatMessage
  };
};

export const createContribution = async (input: CreateContributionInput) => {
  const now = new Date().toISOString();

  const contribution: Contribution = {
    id: randomUUID(),
    cardId: input.cardId,
    authorName: input.authorName,
    authorRole: input.authorRole?.trim() ? input.authorRole.trim() : null,
    message: input.message,
    status: "visible",
    source: "manual",
    createdAt: now,
    updatedAt: now
  };

  await saveContribution(contribution);

  logger.info("funnel.contribution_created", "Contribution created", {
    cardId: contribution.cardId,
    contributionId: contribution.id,
    source: contribution.source
  });

  return contribution;
};
