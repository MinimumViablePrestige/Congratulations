import { notFound } from "next/navigation";
import {
  getCardDraftByManageToken,
  listAllContributionsByCardId,
  listContributionsByCardId
} from "@/lib/cards/repository";
import { cardTemplates } from "@/lib/cards/templates";
import { finalCardLayouts } from "@/lib/final-card/layouts";
import { buildFinalCardViewModel } from "@/lib/final-card/view-model";
import type { FinalCardOptionalBlockId } from "@/lib/final-card/types";
import { buildReminderText } from "@/lib/manage/reminder";
import { setContributionStatusAction } from "./actions";
import { BlockSettingsForm } from "./block-settings-form";
import { ContributionEditor } from "./contribution-editor";
import styles from "./manage-page.module.css";

type Props = {
  params: Promise<{
    manageToken: string;
  }>;
};

export default async function ManagePage({ params }: Props) {
  const { manageToken } = await params;
  const card = await getCardDraftByManageToken(manageToken);

  if (!card) {
    notFound();
  }

  const allContributions = await listAllContributionsByCardId(card.id);
  const visibleContributions = await listContributionsByCardId(card.id);
  const reminderText = buildReminderText(card, visibleContributions.length);
  const model = buildFinalCardViewModel(card, visibleContributions);
  const availableModel = buildFinalCardViewModel({ ...card, finalBlockSettings: null }, visibleContributions);
  const style = cardTemplates.find((template) => template.id === card.templateId)?.id ?? "warm-classic";
  const optionalLayoutBlocks = finalCardLayouts[style].blocks.filter((block) => !block.required);
  const blockMeta: Record<FinalCardOptionalBlockId, { label: string; description: string }> = {
    summary: {
      label: "Вводный блок",
      description: "Короткое общее описание открытки и контекста."
    },
    qualities: {
      label: "Какая ты / какой ты для нас",
      description: "Блок с качествами, которые собраны из поздравлений."
    },
    memories: {
      label: "Теплые воспоминания",
      description: "Небольшие выделенные истории и фрагменты из поздравлений."
    },
    quotes: {
      label: "Лучшие фразы",
      description: "Короткие сильные цитаты из поздравлений."
    }
  };
  const currentBlockIds = model.blocks.map((block) => block.id);
  const availableBlockIds = availableModel.blocks.map((block) => block.id);
  const blockOptions = optionalLayoutBlocks.map((block) => ({
    id: block.id as FinalCardOptionalBlockId,
    label: blockMeta[block.id as FinalCardOptionalBlockId].label,
    description: blockMeta[block.id as FinalCardOptionalBlockId].description,
    checked: card.finalBlockSettings?.[block.id as FinalCardOptionalBlockId] ?? true,
    disabled: !availableBlockIds.includes(block.id)
  }));

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Секретная ссылка организатора</p>
          <h1 className={styles.title}>Управление открыткой для {card.recipientName}</h1>
          <p className={styles.subtitle}>
            Здесь можно следить за поздравлениями, скрывать неподходящие сообщения и смотреть, как будет выглядеть
            финальная открытка до оплаты и публикации.
          </p>
          <div className={styles.stats}>
            <div className={styles.stat}>Повод: {card.occasionText}</div>
            <div className={styles.stat}>Статус: {card.status}</div>
            <div className={styles.stat}>Оплата: {card.paymentStatus}</div>
            <div className={styles.stat}>Всего поздравлений: {allContributions.length}</div>
            <div className={styles.stat}>Видимых: {visibleContributions.length}</div>
          </div>
        </section>

        <div className={styles.layout}>
          <section className={styles.panel}>
            <h2 className={styles.sectionTitle}>Поздравления</h2>
            <p className={styles.hint}>
              На этом этапе уже можно скрыть или удалить сообщение, если оно не подходит по тону или качеству.
            </p>

            {allContributions.length === 0 ? (
              <p className={styles.empty}>Пока поздравлений нет. Сначала участники должны добавить свои сообщения.</p>
            ) : (
              <div className={styles.contributionList}>
                {allContributions.map((contribution) => (
                  <article key={contribution.id} className={styles.contributionCard}>
                    <div className={styles.row}>
                      <div>
                        <span className={styles.author}>{contribution.authorName}</span>
                        {contribution.authorRole ? <span className={styles.meta}> · {contribution.authorRole}</span> : null}
                      </div>
                      <span className={styles.statusBadge}>{contribution.status}</span>
                    </div>
                    <ContributionEditor
                      contributionId={contribution.id}
                      manageToken={manageToken}
                      initialMessage={contribution.message}
                    />
                    <div className={styles.controls}>
                      <form action={setContributionStatusAction}>
                        <input type="hidden" name="manageToken" value={manageToken} />
                        <input type="hidden" name="contributionId" value={contribution.id} />
                        <input type="hidden" name="status" value="visible" />
                        <button type="submit" className={styles.button}>
                          Показать
                        </button>
                      </form>
                      <form action={setContributionStatusAction}>
                        <input type="hidden" name="manageToken" value={manageToken} />
                        <input type="hidden" name="contributionId" value={contribution.id} />
                        <input type="hidden" name="status" value="hidden" />
                        <button type="submit" className={styles.secondaryButton}>
                          Скрыть
                        </button>
                      </form>
                      <form action={setContributionStatusAction}>
                        <input type="hidden" name="manageToken" value={manageToken} />
                        <input type="hidden" name="contributionId" value={contribution.id} />
                        <input type="hidden" name="status" value="deleted" />
                        <button type="submit" className={styles.dangerButton}>
                          Удалить
                        </button>
                      </form>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <div className={styles.layoutRight}>
            <section className={styles.actionsCard}>
              <h2 className={styles.sectionTitle}>Быстрые материалы</h2>
              <p className={styles.line}>
                Ссылка для участников: <code>/card/{card.publicSlug}</code>
              </p>
              <p className={styles.line}>
                Финальный экран: <code>/gift/{card.finalSlug}</code>
              </p>
              <p className={styles.line}>
                Напоминание для чата: <code>{reminderText}</code>
              </p>
            </section>

            <section className={styles.actionsCard}>
              <h2 className={styles.sectionTitle}>Состав финального экрана</h2>
              <p className={styles.line}>Здесь можно включать и выключать необязательные части финальной открытки.</p>
              <BlockSettingsForm manageToken={manageToken} options={blockOptions} />
              <p className={styles.line}>
                Сейчас в финальный экран попадают: <code>{currentBlockIds.join(", ")}</code>
              </p>
            </section>

            <section className={styles.previewCard}>
              <h2 className={styles.sectionTitle}>Предпросмотр</h2>
              <p className={styles.previewText}>
                Получатель увидит открытку для <strong>{card.recipientName}</strong> от <strong>{card.fromLabel}</strong>.
              </p>
              <p className={styles.previewText}>
                Контекст открытки: <strong>{card.occasionText}</strong>
              </p>
              {card.description ? <p className={styles.previewText}>{card.description}</p> : null}
              <p className={styles.previewText}>
                Пока видимых поздравлений: <strong>{visibleContributions.length}</strong>
              </p>
              {visibleContributions.slice(0, 3).map((item) => (
                <article key={item.id} className={styles.contributionCard}>
                  <div className={styles.row}>
                    <span className={styles.author}>{item.authorName}</span>
                    {item.authorRole ? <span className={styles.meta}>{item.authorRole}</span> : null}
                  </div>
                  <p className={styles.message}>{item.message}</p>
                </article>
              ))}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
