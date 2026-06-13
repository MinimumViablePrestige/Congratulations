export type FinalCardBlockId =
  | "hero"
  | "summary"
  | "qualities"
  | "messages"
  | "memories"
  | "quotes"
  | "closing";

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
