import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import {
  getCardDraftByManageToken,
  listAllContributionsByCardId,
  listCardMediaAssetsByCardId,
  listContributionsByCardId
} from "@/lib/cards/repository";
import { cardTemplates } from "@/lib/cards/templates";
import { finalCardLayouts } from "@/lib/final-card/layouts";
import { getFinalCardMessageLayoutProfile } from "@/lib/final-card/message-layout-rules";
import type { FinalCardBlockId, FinalCardOptionalBlockId } from "@/lib/final-card/types";
import { buildFinalCardViewModel } from "@/lib/final-card/view-model";
import { buildReminderText } from "@/lib/manage/reminder";
import { BasicsSettingsForm } from "./basics-settings-form";
import { BlockSettingsForm } from "./block-settings-form";
import { ContributionEditor } from "./contribution-editor";
import { MediaManager } from "./media-manager";
import { TemplateSettingsForm } from "./template-settings-form";
import { moveContributionAction, setContributionStatusAction } from "./actions";
import styles from "./manage-page.module.css";

type Props = {
  params: Promise<{
    manageToken: string;
  }>;
  searchParams: Promise<{
    tab?: string;
  }>;
};

const tabItems = [
  { id: "design", label: "Оформление открытки" },
  { id: "content", label: "Поздравления и фото" }
] as const;

const stepItems = [
  {
    id: 1,
    title: "Основа открытки",
    subtitle: "Заполните основные данные"
  },
  {
    id: 2,
    title: "Состав открытки",
    subtitle: "Настройте структуру и блоки"
  }
] as const;

const managedBlockIds: FinalCardBlockId[] = ["hero", "summary", "qualities", "messages", "quotes", "ai-summary", "closing"];

const layoutModeLabels: Record<string, string> = {
  "grid-2": "grid-2",
  "carousel-1": "carousel-1",
  "carousel-2": "carousel-2",
  "column-media": "column-media"
};

const blockPreviewLabels: Partial<Record<FinalCardBlockId, string>> = {
  summary: "Вводный блок",
  quotes: "Лучшие фразы",
  messages: "Поздравления"
};

const formatEventDate = (value: string | null) => {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
};

export default async function ManagePage({ params, searchParams }: Props) {
  const { manageToken } = await params;
  const { tab } = await searchParams;
  const activeTab = tab === "content" ? "content" : "design";
  const card = await getCardDraftByManageToken(manageToken);

  if (!card) {
    notFound();
  }

  const allContributions = await listAllContributionsByCardId(card.id);
  const visibleContributions = await listContributionsByCardId(card.id);
  const mediaAssets = await listCardMediaAssetsByCardId(card.id);
  const reminderText = buildReminderText(card, visibleContributions.length);
  const model = buildFinalCardViewModel(card, visibleContributions, mediaAssets);
  const availableModel = buildFinalCardViewModel({ ...card, finalBlockSettings: null }, visibleContributions, mediaAssets);
  const style = cardTemplates.find((template) => template.id === card.templateId)?.id ?? "warm-classic";
  const selectedTemplate = cardTemplates.find((template) => template.id === card.templateId) ?? cardTemplates[0];
  const layoutMode = card.finalMessageSettings?.layoutMode ?? "grid-2";
  const mediaLayout = card.finalMessageSettings?.mediaLayout ?? "portrait";
  const layoutProfile = getFinalCardMessageLayoutProfile(layoutMode);
  const showAllLink = visibleContributions.length > layoutProfile.cardsPerPage;
  const optionalLayoutBlocks = finalCardLayouts[style].blocks.filter((block) => !block.required);

  const blockMeta: Record<FinalCardOptionalBlockId, { label: string; description: string }> = {
    summary: {
      label: "Вводный блок",
      description: "Коротко объясняет, по какому поводу собрана открытка."
    },
    qualities: {
      label: "Качества",
      description: "Подсвечивает, за что именно любят и ценят человека."
    },
    memories: {
      label: "Моменты и фото",
      description: "Даёт место под фотографии, подписи и тёплые визуальные детали."
    },
    quotes: {
      label: "Лучшие фразы",
      description: "Выносит самые сильные короткие строки из поздравлений."
    },
    "ai-summary": {
      label: "Общее поздравление",
      description: "Сводный блок, который собирает общий голос группы."
    }
  };

  const availableBlockIds = availableModel.blocks.map((block) => block.id);
  const blockOptions = optionalLayoutBlocks.map((block) => ({
    id: block.id as FinalCardOptionalBlockId,
    label: blockMeta[block.id as FinalCardOptionalBlockId].label,
    description: blockMeta[block.id as FinalCardOptionalBlockId].description,
    checked: card.finalBlockSettings?.[block.id as FinalCardOptionalBlockId] ?? true,
    disabled: !availableBlockIds.includes(block.id)
  }));
  const blockState = Object.fromEntries(
    blockOptions.map((option) => [option.id, card.finalBlockSettings?.[option.id] ?? true])
  ) as Record<FinalCardOptionalBlockId, boolean>;
  const savedBlockOrder = card.finalBlockOrder?.filter((blockId) => managedBlockIds.includes(blockId)) ?? [];
  const initialBlockOrder = [...savedBlockOrder, ...managedBlockIds.filter((blockId) => !savedBlockOrder.includes(blockId))];

  const recipientName = card.recipientName.trim() || "Кристина";
  const occasionText = card.occasionText.trim() || "За выпускной";
  const previewDescription =
    card.description?.trim() || `Собираем красивую открытку для ${recipientName}, где каждое поздравление складывается в один тёплый подарок.`;
  const previewMessages = visibleContributions.slice(0, 1);
  const quotePreview = model.quotes[0] || "Спасибо тебе за твою доброту, поддержку и за то, что ты такая, какая есть.";
  const previewMessage = previewMessages[0];
  const formattedEventDate = formatEventDate(card.eventDate ?? null);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroTop}>
            <div className={styles.heroContent}>
              <p className={styles.heroBreadcrumbs}>
                <span>Организатор: {card.organizerName.trim() || "Евсей"}</span>
                <span>Повод: {occasionText}</span>
              </p>
              <h1 className={styles.title}>Открытка для {recipientName}</h1>
              <p className={styles.subtitle}>
                Создайте красивую открытку и соберите искренние поздравления от всех участников. Всё сохранится,
                ничего не потеряется между шагами.
              </p>

              <div className={styles.stats}>
                <div className={styles.stat}>Повод: {occasionText}</div>
                <div className={styles.stat}>Сообщений: {allContributions.length}</div>
                <div className={styles.stat}>Видимых: {visibleContributions.length}</div>
                <div className={styles.stat}>Сетка: {layoutModeLabels[layoutMode] ?? layoutMode}</div>
              </div>

              <nav className={styles.tabBar} aria-label="Разделы управления открыткой">
                {tabItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/manage/${manageToken}?tab=${item.id}`}
                    className={`${styles.tabLink} ${activeTab === item.id ? styles.tabLinkActive : ""}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <aside className={styles.heroTemplateCard}>
              <div className={styles.heroTemplateInfo}>
                <span className={styles.heroTemplateLabel}>Текущий шаблон</span>
                <strong className={styles.heroTemplateName}>{selectedTemplate.name}</strong>
              </div>

              <div
                className={styles.heroTemplateThumb}
                style={
                  {
                    "--template-accent": selectedTemplate.accent
                  } as CSSProperties
                }
                aria-hidden="true"
              >
                <div className={styles.heroTemplateThumbPaper}>
                  <span>{recipientName}</span>
                </div>
              </div>

              <TemplateSettingsForm
                manageToken={manageToken}
                templates={cardTemplates}
                initialTemplateId={selectedTemplate.id}
                initialLayoutMode={layoutMode}
                initialMediaLayout={mediaLayout}
                initialBlockOrder={initialBlockOrder}
                blockState={blockState}
                variant="hero"
              />
            </aside>
          </div>
        </section>

        {activeTab === "design" ? (
          <div className={styles.designStudio}>
            <div className={styles.designMain}>
              <section className={styles.stepperCard}>
                <div className={styles.stepperGrid}>
                  {stepItems.map((item, index) => (
                    <div key={item.id} className={styles.stepperItem}>
                      <div className={`${styles.stepperDot} ${index === 0 ? styles.stepperDotActive : ""}`}>{item.id}</div>
                      <div className={styles.stepperText}>
                        <strong>{item.title}</strong>
                        <span>{item.subtitle}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={styles.stepperLine}>
                  <span className={styles.stepperLineFill} />
                  <span className={styles.stepperLineKnob} />
                </div>
              </section>

              <section className={styles.panel} id="basics-section">
                <div className={styles.sectionStepHeader}>
                  <span className={styles.sectionStepNumber}>1</span>
                  <div className={styles.sectionStepText}>
                    <h2 className={styles.sectionTitle}>Основа открытки</h2>
                  </div>
                </div>

                <BasicsSettingsForm manageToken={manageToken} card={card} />
              </section>

              <section className={styles.studioPanel} id="composition-section">
                <div className={styles.sectionStepHeader}>
                  <span className={styles.sectionStepNumber}>2</span>
                  <div className={styles.sectionStepText}>
                    <h2 className={styles.sectionTitle}>Состав открытки</h2>
                  </div>
                </div>

                <BlockSettingsForm
                  manageToken={manageToken}
                  options={blockOptions}
                  initialLayoutMode={layoutMode}
                  initialMediaLayout={mediaLayout}
                  initialBlockOrder={initialBlockOrder}
                />
              </section>
            </div>

            <aside className={styles.designRail}>
              <section className={styles.previewPanel}>
                <div className={styles.previewPanelHeader}>
                  <div>
                    <h2 className={styles.sectionTitle}>Предпросмотр</h2>
                    <p className={styles.previewStatusLine}>
                      <span className={styles.previewStatusDot} />
                      <span>Предпросмотр обновляется автоматически</span>
                    </p>
                  </div>
                </div>

                <div className={styles.previewFrame}>
                  <article
                    className={styles.previewMock}
                    style={
                      {
                        "--preview-accent": selectedTemplate.accent
                      } as CSSProperties
                    }
                  >
                    <section className={styles.previewHeroCard}>
                      <div className={styles.previewHeroFloral} />
                      <div className={styles.previewHeroText}>
                        <h3 className={styles.previewHeroTitle}>{recipientName},</h3>
                        <p className={styles.previewHeroSubtitle}>эта открытка для тебя!</p>
                      </div>
                      <div className={styles.previewHeroOccasion}>
                        <strong>{occasionText}</strong>
                        <span>
                          от {card.fromLabel.trim() || "Евсея и всей группы"}
                          {formattedEventDate ? ` • ${formattedEventDate}` : ""}
                        </span>
                      </div>
                    </section>

                    <section className={styles.previewQuoteCard}>
                      <span className={styles.previewQuoteMark}>“</span>
                      <p>{quotePreview}</p>
                      <div className={styles.previewDots}>
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                      </div>
                    </section>

                    <section className={styles.previewMessageSection}>
                      <span className={styles.previewMessageLabel}>{blockPreviewLabels.messages}</span>
                      <article className={styles.previewSingleMessage}>
                        <div className={styles.previewSingleAvatar} />
                        <div className={styles.previewSingleBody}>
                          <strong>{previewMessage?.authorName || "Аня"}</strong>
                          <p>
                            {previewMessage?.message.slice(0, 118) ||
                              "Крис, ты невероятная! Пусть новый этап жизни принесёт много счастья и возможностей!"}
                          </p>
                        </div>
                      </article>
                    </section>

                    <section className={styles.previewFinalCard}>
                      <span>Спасибо, что ты с нами!</span>
                      <p>Вперёд — к мечтам!</p>
                    </section>
                  </article>
                </div>

                <Link href={`/gift/${card.finalSlug}`} target="_blank" className={styles.previewLinkButton}>
                  Открыть полный просмотр
                </Link>
              </section>
            </aside>
          </div>
        ) : (
          <div className={styles.layout}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Поздравления</h2>
                  <p className={styles.hint}>
                    Здесь редактируем тексты, меняем порядок и сразу видим, насколько каждое поздравление укладывается
                    в текущую сетку.
                  </p>
                </div>
                <span className={styles.infoBadge}>{allContributions.length} записей</span>
              </div>

              {allContributions.length === 0 ? (
                <p className={styles.empty}>Пока поздравлений нет. Сначала участники должны добавить свои сообщения.</p>
              ) : (
                <div className={styles.contributionList}>
                  {allContributions.map((contribution) => {
                    const overflow = contribution.message.length - layoutProfile.maxChars;
                    const isTooLong = overflow > 0;

                    return (
                      <article
                        key={contribution.id}
                        className={`${styles.contributionCard} ${isTooLong ? styles.contributionCardWarn : ""}`}
                      >
                        <div className={styles.contributionHeader}>
                          <div className={styles.contributionIdentity}>
                            <span className={styles.author}>{contribution.authorName}</span>
                            {contribution.authorRole ? <span className={styles.meta}>· {contribution.authorRole}</span> : null}
                          </div>

                          <div className={styles.badgeRow}>
                            <span className={styles.sortBadge}>#{contribution.sortOrder + 1}</span>
                            <span className={styles.sortBadge} title="Символы / лимит">
                              {contribution.message.length} / {layoutProfile.maxChars}
                            </span>
                            <span className={styles.statusBadge}>{contribution.status}</span>
                          </div>
                        </div>

                        <div className={styles.contributionSummary}>
                          <span className={isTooLong ? styles.limitWarning : styles.limitOk}>
                            {isTooLong ? `Нужно сократить на ${overflow} символов` : "Карточка укладывается в текущий формат"}
                          </span>
                        </div>

                        <ContributionEditor
                          contributionId={contribution.id}
                          manageToken={manageToken}
                          initialMessage={contribution.message}
                          messageLimit={layoutProfile.maxChars}
                        />

                        <div className={styles.controls}>
                          <form action={moveContributionAction}>
                            <input type="hidden" name="manageToken" value={manageToken} />
                            <input type="hidden" name="contributionId" value={contribution.id} />
                            <input type="hidden" name="direction" value="up" />
                            <button type="submit" className={styles.secondaryButton}>
                              Выше
                            </button>
                          </form>
                          <form action={moveContributionAction}>
                            <input type="hidden" name="manageToken" value={manageToken} />
                            <input type="hidden" name="contributionId" value={contribution.id} />
                            <input type="hidden" name="direction" value="down" />
                            <button type="submit" className={styles.secondaryButton}>
                              Ниже
                            </button>
                          </form>
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
                    );
                  })}
                </div>
              )}
            </section>

            <div className={styles.layoutRight}>
              <MediaManager manageToken={manageToken} mediaAssets={mediaAssets} mediaLayout={mediaLayout} />

              <section className={styles.actionsCard}>
                <h2 className={styles.sectionTitle}>Быстрые ссылки</h2>
                <div className={styles.linksList}>
                  <p className={styles.line}>
                    Участники: <code>/card/{card.publicSlug}</code>
                  </p>
                  <p className={styles.line}>
                    Финальная открытка: <code>/gift/{card.finalSlug}</code>
                  </p>
                  <p className={styles.line}>
                    Все поздравления: <code>/gift/{card.finalSlug}/messages</code>
                  </p>
                </div>
              </section>

              <section className={styles.actionsCard}>
                <h2 className={styles.sectionTitle}>Подсказка для чата</h2>
                <p className={styles.previewText}>
                  Напоминание для участников: <code>{reminderText}</code>
                </p>
              </section>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
