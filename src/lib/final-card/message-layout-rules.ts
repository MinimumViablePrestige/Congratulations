import type { FinalCardBlockId, FinalCardMessageLayoutMode } from "@/lib/final-card/types";

export type FinalCardMessageLayoutProfile = {
  cardsPerPage: number;
  advanceBy: number;
  maxChars: number;
  pageColumns: number;
  pageRows: number;
  pageVariant: "grid" | "column-media";
};

const countOptionalBlocks = (blockIds: FinalCardBlockId[]) =>
  blockIds.filter((blockId) => blockId !== "hero" && blockId !== "messages" && blockId !== "closing").length;

export const getFinalCardMessageLayoutProfile = (
  layoutMode: FinalCardMessageLayoutMode,
  blockIds: FinalCardBlockId[] = []
): FinalCardMessageLayoutProfile => {
  const optionalBlocks = countOptionalBlocks(blockIds);

  if (layoutMode === "carousel-1") {
    return {
      cardsPerPage: 3,
      advanceBy: 1,
      maxChars: 300,
      pageColumns: 3,
      pageRows: 1,
      pageVariant: "grid"
    };
  }

  if (layoutMode === "carousel-2") {
    return {
      cardsPerPage: 6,
      advanceBy: 3,
      maxChars: 170,
      pageColumns: 3,
      pageRows: 2,
      pageVariant: "grid"
    };
  }

  if (layoutMode === "column-media") {
    return {
      cardsPerPage: 4,
      advanceBy: 1,
      maxChars: 220,
      pageColumns: 1,
      pageRows: 4,
      pageVariant: "column-media"
    };
  }

  const expandedGrid = optionalBlocks <= 1;

  return {
    cardsPerPage: expandedGrid ? 6 : 4,
    advanceBy: 2,
    maxChars: expandedGrid ? 180 : 220,
    pageColumns: 2,
    pageRows: expandedGrid ? 3 : 2,
    pageVariant: "grid"
  };
};

export const splitIntoMessagePages = <T>(items: T[], cardsPerPage: number, advanceBy = cardsPerPage) => {
  if (cardsPerPage <= 0 || advanceBy <= 0) {
    return [items];
  }

  const pages: T[][] = [];

  for (let index = 0; index < items.length; index += advanceBy) {
    pages.push(items.slice(index, index + cardsPerPage));

    if (index + cardsPerPage >= items.length) {
      break;
    }
  }

  return pages;
};
