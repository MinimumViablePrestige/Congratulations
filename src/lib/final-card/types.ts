export type FinalCardBlockId =
  | "hero"
  | "summary"
  | "qualities"
  | "messages"
  | "memories"
  | "quotes"
  | "closing";

export type FinalCardOptionalBlockId = Exclude<FinalCardBlockId, "hero" | "messages" | "closing">;

export type FinalCardStyleId =
  | "warm-classic"
  | "team-modern"
  | "bright-celebration"
  | "gentle-personal";

export type FinalCardBlockDefinition = {
  id: FinalCardBlockId;
  required: boolean;
};

export type FinalCardLayout = {
  style: FinalCardStyleId;
  blocks: FinalCardBlockDefinition[];
};

export type FinalCardContentAvailability = {
  hasSummary: boolean;
  hasQualities: boolean;
  hasMemories: boolean;
  hasQuotes: boolean;
};

export type FinalCardBlockSettings = Partial<Record<FinalCardOptionalBlockId, boolean>>;

export type FinalCardMessageLayoutMode = "grid-2" | "carousel-1" | "carousel-2";

export type FinalCardMessageSettings = {
  layoutMode: FinalCardMessageLayoutMode;
  showAllLink: boolean;
};
