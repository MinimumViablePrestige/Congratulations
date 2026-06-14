import { getFinalCardMessageLayoutProfile, splitIntoMessagePages } from "@/lib/final-card/message-layout-rules";

describe("getFinalCardMessageLayoutProfile", () => {
  it("keeps 2x2 grid when there are enough surrounding blocks", () => {
    const profile = getFinalCardMessageLayoutProfile("grid-2", [
      "hero",
      "summary",
      "qualities",
      "messages",
      "quotes",
      "closing"
    ]);

    expect(profile.cardsPerPage).toBe(4);
    expect(profile.pageRows).toBe(2);
    expect(profile.advanceBy).toBe(2);
  });

  it("expands grid when the message area becomes larger", () => {
    const profile = getFinalCardMessageLayoutProfile("grid-2", ["hero", "messages", "closing"]);

    expect(profile.cardsPerPage).toBe(6);
    expect(profile.pageRows).toBe(3);
    expect(profile.advanceBy).toBe(2);
  });

  it("uses row step for two-row mode", () => {
    const profile = getFinalCardMessageLayoutProfile("carousel-2");

    expect(profile.cardsPerPage).toBe(6);
    expect(profile.advanceBy).toBe(3);
  });

  it("uses dedicated limits for column and media mode", () => {
    const profile = getFinalCardMessageLayoutProfile("column-media");

    expect(profile.cardsPerPage).toBe(4);
    expect(profile.maxChars).toBe(220);
    expect(profile.pageVariant).toBe("column-media");
  });
});

describe("splitIntoMessagePages", () => {
  it("supports overlapping pages by row step", () => {
    expect(splitIntoMessagePages([1, 2, 3, 4, 5], 4, 2)).toEqual([
      [1, 2, 3, 4],
      [3, 4, 5]
    ]);
  });
});
