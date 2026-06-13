import { NextResponse } from "next/server";
import { getCardDraftByManageToken, updateContributionStatus } from "@/lib/cards/repository";
import { logger } from "@/lib/logger";

const allowedStatuses = new Set(["visible", "hidden", "deleted"]);

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    manageToken?: string;
    contributionId?: string;
    status?: "visible" | "hidden" | "deleted";
  };

  if (!payload.manageToken || !payload.contributionId || !payload.status || !allowedStatuses.has(payload.status)) {
    return NextResponse.json({ ok: false, message: "Некорректный запрос управления поздравлением." }, { status: 400 });
  }

  const card = await getCardDraftByManageToken(payload.manageToken);
  if (!card) {
    return NextResponse.json({ ok: false, message: "Секретная ссылка управления больше не актуальна." }, { status: 404 });
  }

  const updated = await updateContributionStatus(payload.contributionId, payload.status);
  if (!updated || updated.cardId !== card.id) {
    return NextResponse.json({ ok: false, message: "Поздравление не найдено." }, { status: 404 });
  }

  logger.info("manage.contribution_status_updated", "Contribution status updated by organizer", {
    cardId: card.id,
    contributionId: updated.id,
    status: updated.status
  });

  return NextResponse.json({ ok: true, contribution: updated }, { status: 200 });
}
