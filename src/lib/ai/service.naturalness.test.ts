import { generateParticipantMessage } from "@/lib/ai/service";

describe("AI draft naturalness", () => {
  it("cleans aggressive punctuation from user fragments", async () => {
    const result = await generateParticipantMessage({
      cardId: `card_test_punct_${Date.now()}`,
      recipientName: "Анидовна",
      occasion: "personal",
      occasionText: "собираем открытку для любимого воспитателя группы",
      relation: "!Воспитатель.!",
      qualities: ["!добрый", "внимательный!", "заботливый!"],
      wishes: ["здоровья", "тепла", "новых возможностей"],
      personalDetail: "!Умеет очень громко кричать!",
      style: "humor"
    });

    const text = result.variants.map((item) => item.text).join(" ");
    expect(text).not.toContain("!");
    expect(text).toContain("как человек");
  });

  it("does not insert negative personal detail into the final text", async () => {
    const result = await generateParticipantMessage({
      cardId: `card_test_detail_${Date.now()}`,
      recipientName: "Анидовна",
      occasion: "personal",
      occasionText: "собираем открытку в благодарность за заботу о детях",
      relation: "ученик",
      qualities: ["добрый", "заботливый"],
      wishes: ["спокойствия", "новых возможностей"],
      personalDetail: "Умеет очень громко кричать",
      style: "humor"
    });

    const text = result.variants.map((item) => item.text).join(" ").toLowerCase();
    expect(text).not.toContain("крич");
    expect(text).not.toContain("работать");
  });

  it("produces different drafts for repeated generations on the same card", async () => {
    const cardId = `card_test_repeat_${Date.now()}`;
    const first = await generateParticipantMessage({
      cardId,
      recipientName: "Анна",
      occasion: "team",
      occasionText: "собираем открытку от команды продукта",
      relation: "родитель",
      qualities: ["добрый", "внимательный"],
      wishes: ["здоровья", "радости"],
      personalDetail: "Всегда поддерживает добрым словом",
      style: "warm-simple"
    });

    const second = await generateParticipantMessage({
      cardId,
      recipientName: "Анна",
      occasion: "team",
      occasionText: "собираем открытку от команды продукта",
      relation: "родитель",
      qualities: ["добрый", "внимательный"],
      wishes: ["здоровья", "радости"],
      personalDetail: "Всегда поддерживает добрым словом",
      style: "warm-simple"
    });

    const firstJoined = first.variants.map((item) => item.text).join(" ");
    const secondJoined = second.variants.map((item) => item.text).join(" ");

    expect(firstJoined).not.toBe(secondJoined);
  });
});
