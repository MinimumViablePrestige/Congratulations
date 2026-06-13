import { generateParticipantMessage } from "@/lib/ai/service";

describe("AI draft naturalness", () => {
  it("cleans aggressive punctuation from user fragments", async () => {
    const result = await generateParticipantMessage({
      cardId: `card_test_punct_${Date.now()}`,
      recipientName: "Анидовна",
      occasion: "caregiver",
      relation: "!Воспитатель.!",
      qualities: ["!добрый", "внимательный!", "заботливый!"],
      wishes: ["здоровья", "тепла", "новых возможностей"],
      personalDetail: "!Умеет очень громко кричать!",
      style: "humor"
    });

    const text = result.variants.map((item) => item.text).join(" ");
    expect(text).not.toContain("!");
    expect(text).toContain("как воспитатель");
  });
});
