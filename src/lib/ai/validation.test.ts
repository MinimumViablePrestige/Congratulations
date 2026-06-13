import { validateAiGenerationFormData } from "@/lib/ai/validation";

const buildFormData = (entries: Record<string, string>) => {
  const formData = new FormData();

  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value);
  }

  return formData;
};

describe("validateAiGenerationFormData", () => {
  it("accepts valid AI generation input", () => {
    const result = validateAiGenerationFormData(
      buildFormData({
        cardId: "card_1",
        recipientName: "Анна",
        occasion: "personal",
        occasionText: "благодарим за заботу о группе",
        relation: "родитель",
        qualities: "добрый",
        wishes: "здоровья",
        personalDetail: "Спасибо за спокойствие и поддержку детей.",
        style: "warm-simple"
      })
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.qualities).toEqual(["добрый"]);
      expect(result.data.occasionText).toBe("благодарим за заботу о группе");
    }
  });

  it("returns issues when required AI inputs are missing", () => {
    const result = validateAiGenerationFormData(
      buildFormData({
        cardId: "",
        recipientName: "",
        occasion: "wrong",
        occasionText: "",
        relation: "",
        qualities: "",
        wishes: "",
        personalDetail: "ok",
        style: "none"
      })
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues.length).toBeGreaterThanOrEqual(6);
    }
  });
});
