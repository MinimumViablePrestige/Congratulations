import type { CardDraft, Contribution } from "@/lib/cards/types";
import { buildFinalCardViewModel } from "@/lib/final-card/view-model";

const card: CardDraft = {
  id: "card_1",
  publicSlug: "public_1",
  manageToken: "manage_1",
  finalSlug: "final_1",
  recipientName: "Анна",
  occasion: "team",
  occasionText: "собираем открытку от команды Product & Design",
  fromLabel: "команды Product & Design",
  organizerName: "Ирина",
  organizerEmail: "irina@example.com",
  eventDate: null,
  description: "Спасибо за поддержку, энергию и человеческое тепло.",
  templateId: "team-modern",
  finalBlockSettings: null,
  finalMessageSettings: null,
  status: "draft",
  paymentStatus: "unpaid",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
};

const contributions: Contribution[] = [
  {
    id: "c1",
    cardId: "card_1",
    authorName: "Мария",
    authorRole: "UX Designer",
    message: "С тобой всегда чувствуется поддержка, внимание и тепло. Спасибо за мудрость и заботу.",
    sortOrder: 0,
    status: "visible",
    source: "manual",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  }
];

describe("buildFinalCardViewModel", () => {
  it("builds a final card model from card and contributions", () => {
    const viewModel = buildFinalCardViewModel(card, contributions);

    expect(viewModel.style).toBe("team-modern");
    expect(viewModel.participantCount).toBe(1);
    expect(viewModel.blocks.length).toBeGreaterThan(0);
    expect(viewModel.summaryTitle).toContain("Анна");
    expect(viewModel.occasionLabel).toBe("собираем открытку от команды Product & Design");
    expect(viewModel.finalSlug).toBe("final_1");
    expect(viewModel.messageLayoutMode).toBe("grid-2");
    expect(viewModel.showAllMessagesLink).toBe(true);
  });

  it("hides optional blocks that organizer disabled", () => {
    const viewModel = buildFinalCardViewModel(
      {
        ...card,
        finalBlockSettings: {
          summary: false,
          quotes: false
        }
      },
      contributions
    );

    expect(viewModel.blocks.map((block) => block.id)).toEqual(["hero", "qualities", "messages", "closing"]);
  });

  it("passes message presentation settings to the final screen", () => {
    const viewModel = buildFinalCardViewModel(
      {
        ...card,
        finalMessageSettings: {
          layoutMode: "carousel-2",
          showAllLink: false
        }
      },
      contributions
    );

    expect(viewModel.messageLayoutMode).toBe("carousel-2");
    expect(viewModel.showAllMessagesLink).toBe(false);
  });
});
