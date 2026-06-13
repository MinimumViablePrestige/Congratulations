"use server";

import { revalidatePath } from "next/cache";
import {
  getCardDraftById,
  getCardDraftByManageToken,
  updateCardFinalBlockSettings,
  updateContributionMessage,
  updateContributionStatus
} from "@/lib/cards/repository";
import { validateContributionMessage } from "@/lib/contributions/validation";
import type { FinalCardBlockSettings, FinalCardOptionalBlockId } from "@/lib/final-card/types";
import { logger } from "@/lib/logger";

export async function setContributionStatusAction(formData: FormData) {
  const contributionId = String(formData.get("contributionId") ?? "");
  const manageToken = String(formData.get("manageToken") ?? "");
  const status = String(formData.get("status") ?? "") as "visible" | "hidden" | "deleted";

  if (!contributionId || !manageToken || !status) {
    return;
  }

  const updated = await updateContributionStatus(contributionId, status);
  if (!updated) {
    return;
  }

  const card = await getCardDraftById(updated.cardId);

  logger.info("manage.contribution_status_updated", "Contribution status updated by organizer", {
    contributionId,
    status
  });

  revalidatePath(`/manage/${manageToken}`);
  if (card) {
    revalidatePath(`/card/${card.publicSlug}`);
  }
}

export async function updateContributionMessageAction(
  _prevState: { ok: boolean; message: string },
  formData: FormData
) {
  const contributionId = String(formData.get("contributionId") ?? "");
  const manageToken = String(formData.get("manageToken") ?? "");
  const message = String(formData.get("message") ?? "").trim();

  if (!contributionId || !manageToken || !message) {
    return { ok: false, message: "Не удалось сохранить текст поздравления." };
  }

  const card = await getCardDraftByManageToken(manageToken);
  if (!card) {
    return { ok: false, message: "Секретная ссылка управления больше не актуальна." };
  }

  const issues = validateContributionMessage(message);
  if (issues.length > 0) {
    return { ok: false, message: issues[0]?.message ?? "Текст нужно поправить." };
  }

  const updated = await updateContributionMessage(contributionId, message);
  if (!updated || updated.cardId !== card.id) {
    return { ok: false, message: "Поздравление не найдено." };
  }

  logger.info("manage.contribution_message_updated", "Contribution message updated by organizer", {
    cardId: card.id,
    contributionId: updated.id
  });

  revalidatePath(`/manage/${manageToken}`);
  revalidatePath(`/card/${card.publicSlug}`);
  revalidatePath(`/gift/${card.finalSlug}`);

  return { ok: true, message: "Текст поздравления обновлен." };
}

const optionalBlockIds: FinalCardOptionalBlockId[] = ["summary", "qualities", "memories", "quotes"];

export async function updateFinalBlockSettingsAction(
  _prevState: { ok: boolean; message: string },
  formData: FormData
) {
  const manageToken = String(formData.get("manageToken") ?? "");

  if (!manageToken) {
    return { ok: false, message: "Не удалось сохранить настройки блоков." };
  }

  const card = await getCardDraftByManageToken(manageToken);
  if (!card) {
    return { ok: false, message: "Секретная ссылка управления больше не актуальна." };
  }

  const finalBlockSettings = optionalBlockIds.reduce<FinalCardBlockSettings>((acc, blockId) => {
    acc[blockId] = formData.get(blockId) === "on";
    return acc;
  }, {});

  const updated = await updateCardFinalBlockSettings(card.id, finalBlockSettings);
  if (!updated) {
    return { ok: false, message: "Не удалось сохранить состав финального экрана." };
  }

  logger.info("manage.final_block_settings_updated", "Final card block settings updated by organizer", {
    cardId: card.id,
    finalBlockSettings
  });

  revalidatePath(`/manage/${manageToken}`);
  revalidatePath(`/gift/${card.finalSlug}`);

  return { ok: true, message: "Состав финального экрана обновлен." };
}
