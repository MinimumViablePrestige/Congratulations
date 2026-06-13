import { finalCardLayouts } from "@/lib/final-card/layouts";
import type { FinalCardContentAvailability, FinalCardLayout, FinalCardStyleId } from "@/lib/final-card/types";

const isBlockAvailable = (blockId: string, availability: FinalCardContentAvailability) => {
  if (blockId === "summary") {
    return availability.hasSummary;
  }

  if (blockId === "qualities") {
    return availability.hasQualities;
  }

  if (blockId === "memories") {
    return availability.hasMemories;
  }

  if (blockId === "quotes") {
    return availability.hasQuotes;
  }

  return true;
};

export const buildFinalCardLayout = (
  style: FinalCardStyleId,
  availability: FinalCardContentAvailability
): FinalCardLayout => {
  const layout = finalCardLayouts[style];

  return {
    style: layout.style,
    blocks: layout.blocks.filter((block) => block.required || isBlockAvailable(block.id, availability))
  };
};
