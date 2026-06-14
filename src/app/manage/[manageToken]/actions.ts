"use server";

import { revalidatePath } from "next/cache";
import {
  getCardDraftById,
  getCardDraftByManageToken,
  moveContribution,
  updateCardFinalPresentationSettings,
  updateContributionMessage,
  updateContributionStatus
} from "@/lib/cards/repository";
import { validateContributionMessage } from "@/lib/contributions/validation";
import type {
  FinalCardBlockSettings,
  FinalCardMessageLayoutMode,
  FinalCardMessageMediaLayout,
  FinalCardMessageSettings,
  FinalCardOptionalBlockId
} from "@/lib/final-card/types";
import { logger } from "@/lib/logger";

const optionalBlockIds: FinalCardOptionalBlockId[] = ["summary", "qualities", "memories", "quotes"];
const messageLayoutModes: FinalCardMessageLayoutMode[] = [
  "grid-2",
  "carousel-1",
  "carousel-2",
  "column-media"
];
const mediaLayouts: FinalCardMessageMediaLayout[] = ["portrait", "landscape-pair"];

const revalidateCardSurfaces = (manageToken: string, publicSlug: string, finalSlug: string) => {
  revalidatePath(`/manage/${manageToken}`);
  revalidatePath(`/card/${publicSlug}`);
  revalidatePath(`/gift/${finalSlug}`);
  revalidatePath(`/gift/${finalSlug}/messages`);
};

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

  if (card) {
    revalidateCardSurfaces(manageToken, card.publicSlug, card.finalSlug);
  } else {
    revalidatePath(`/manage/${manageToken}`);
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

  const issues = validateContributionMessage(message, {
    layoutMode: card.finalMessageSettings?.layoutMode ?? "grid-2"
  });
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

  revalidateCardSurfaces(manageToken, card.publicSlug, card.finalSlug);

  return { ok: true, message: "Текст поздравления обновлен." };
}

export async function moveContributionAction(formData: FormData) {
  const contributionId = String(formData.get("contributionId") ?? "");
  const manageToken = String(formData.get("manageToken") ?? "");
  const direction = String(formData.get("direction") ?? "") as "up" | "down";

  if (!contributionId || !manageToken || !direction) {
    return;
  }

  const card = await getCardDraftByManageToken(manageToken);
  if (!card) {
    return;
  }

  const updated = await moveContribution(contributionId, direction);
  if (!updated || updated.cardId !== card.id) {
    return;
  }

  logger.info("manage.contribution_reordered", "Contribution order changed by organizer", {
    cardId: card.id,
    contributionId,
    direction
  });

  revalidateCardSurfaces(manageToken, card.publicSlug, card.finalSlug);
}

export async function updateFinalPresentationSettingsAction(
  _prevState: { ok: boolean; message: string },
  formData: FormData
) {
  const manageToken = String(formData.get("manageToken") ?? "");

  if (!manageToken) {
    return { ok: false, message: "Не удалось сохранить настройки финального экрана." };
  }

  const card = await getCardDraftByManageToken(manageToken);
  if (!card) {
    return { ok: false, message: "Секретная ссылка управления больше не актуальна." };
  }

  const layoutModeValue = String(formData.get("layoutMode") ?? "");
  const layoutMode = messageLayoutModes.includes(layoutModeValue as FinalCardMessageLayoutMode)
    ? (layoutModeValue as FinalCardMessageLayoutMode)
    : "grid-2";

  const mediaLayoutValue = String(formData.get("mediaLayout") ?? "");
  const mediaLayout = mediaLayouts.includes(mediaLayoutValue as FinalCardMessageMediaLayout)
    ? (mediaLayoutValue as FinalCardMessageMediaLayout)
    : "portrait";

  const finalBlockSettings = optionalBlockIds.reduce<FinalCardBlockSettings>((acc, blockId) => {
    acc[blockId] = formData.get(blockId) === "on";
    return acc;
  }, {});

  const finalMessageSettings: FinalCardMessageSettings = {
    layoutMode,
    mediaLayout,
    showAllLink: formData.get("showAllLink") === "on"
  };

  const updated = await updateCardFinalPresentationSettings(card.id, finalBlockSettings, finalMessageSettings);
  if (!updated) {
    return { ok: false, message: "Не удалось сохранить состав финального экрана." };
  }

  logger.info("manage.final_presentation_settings_updated", "Final presentation settings updated by organizer", {
    cardId: card.id,
    finalBlockSettings,
    finalMessageSettings
  });

  revalidateCardSurfaces(manageToken, card.publicSlug, card.finalSlug);

  return { ok: true, message: "Настройки финального экрана обновлены." };
}
