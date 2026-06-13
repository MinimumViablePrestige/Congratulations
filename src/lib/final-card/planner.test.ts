import { buildFinalCardLayout } from "@/lib/final-card/planner";

describe("buildFinalCardLayout", () => {
  it("keeps required blocks even when optional content is missing", () => {
    const layout = buildFinalCardLayout("bright-celebration", {
      hasSummary: false,
      hasQualities: false,
      hasMemories: false,
      hasQuotes: false
    });

    expect(layout.blocks.map((block) => block.id)).toEqual(["hero", "messages", "closing"]);
  });

  it("includes optional blocks when matching content exists", () => {
    const layout = buildFinalCardLayout("gentle-personal", {
      hasSummary: true,
      hasQualities: false,
      hasMemories: true,
      hasQuotes: true
    });

    expect(layout.blocks.map((block) => block.id)).toEqual(["hero", "summary", "memories", "messages", "quotes", "closing"]);
  });
});
