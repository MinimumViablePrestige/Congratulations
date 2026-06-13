"use server";

import { revalidatePath } from "next/cache";
import { getCardDraftById, updateContributionStatus } from "@/lib/cards/repository";
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
