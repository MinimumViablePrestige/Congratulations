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
  const model = buildFinalCardViewModel(card, visibleContributions, mediaAssets);
  const availableModel = buildFinalCardViewModel({ ...card, finalBlockSettings: null }, visibleContributions, mediaAssets);
  const style = cardTemplates.find((template) => template.id === card.templateId)?.id ?? "warm-classic";
  const selectedTemplate = cardTemplates.find((template) => template.id === card.templateId) ?? cardTemplates[0];
  const layoutMode = card.finalMessageSettings?.layoutMode ?? "grid-2";
  const mediaLayout = card.finalMessageSettings?.mediaLayout ?? "portrait";
  const layoutProfile = getFinalCardMessageLayoutProfile(layoutMode);
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
  const previewMessages = visibleContributions.slice(0, 1);
  const quotePreview = model.quotes[0] || "Спасибо тебе за твою доброту, поддержку и за то, что ты такая, какая есть.";
  const previewMessage = previewMessages[0];
  const formattedEventDate = formatEventDate(card.eventDate ?? null);
  const tooLongCount = allContributions.filter((contribution) => contribution.message.length > layoutProfile.maxChars).length;
  const withinLimitCount = allContributions.length - tooLongCount;
  const hiddenCount = allContributions.filter((contribution) => contribution.status === "hidden").length;
  const noRoleCount = allContributions.filter((contribution) => !contribution.authorRole?.trim()).length;

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
          <div className={styles.contentStudio}>
            <section className={styles.contentStatusBar}>
              <div className={styles.contentStatusItem}>
                <span className={`${styles.contentStatusDot} ${styles.contentStatusDotWarm}`} />
                <span>{allContributions.length} поздравлений собрано</span>
              </div>
              <div className={styles.contentStatusItem}>
                <span className={`${styles.contentStatusDot} ${styles.contentStatusDotOk}`} />
                <span>{withinLimitCount} подходят по длине</span>
              </div>
              <div className={styles.contentStatusItem}>
                <span className={`${styles.contentStatusDot} ${styles.contentStatusDotAlert}`} />
                <span>{tooLongCount} нужно сократить</span>
              </div>
              <div className={styles.contentStatusItem}>
                <span className={`${styles.contentStatusDot} ${styles.contentStatusDotWarm}`} />
                <span>{mediaAssets.length} фото добавлено</span>
              </div>
            </section>

            <div className={styles.contentLayout}>
              <section className={styles.contentPanel}>
                <div className={styles.contentPanelHeader}>
                  <div>
                    <h2 className={styles.contentPanelTitle}>Поздравления</h2>
                    <p className={styles.contentPanelText}>Проверьте тексты, порядок и видимость поздравлений.</p>
                    <p className={styles.contentPanelText}>
                      Тексты длиннее {layoutProfile.maxChars} символов лучше сократить для выбранного макета.
                    </p>
                  </div>

                  <div className={styles.contentToolbar}>
                    <button type="button" className={styles.contentGhostButton}>
                      <span>+</span>
                      <span>Добавить вручную</span>
                    </button>
                    <button type="button" className={styles.contentGhostButton}>
                      <span>AI</span>
                      <span>Сгенерировать общее поздравление</span>
                    </button>
                    <button type="button" className={styles.contentIconButton} aria-label="Дополнительные действия">
                      …
                    </button>
                  </div>
                </div>

                <div className={styles.contentFilterRow}>
                  <span className={`${styles.contentFilterPill} ${styles.contentFilterPillActive}`}>Все {allContributions.length}</span>
                  <span className={styles.contentFilterPill}>Видимые {visibleContributions.length}</span>
                  <span className={styles.contentFilterPill}>Слишком длинные {tooLongCount}</span>
                  <span className={styles.contentFilterPill}>Скрытые {hiddenCount}</span>
                  <span className={styles.contentFilterPill}>Без роли {noRoleCount}</span>
                </div>

                {allContributions.length === 0 ? (
                  <p className={styles.empty}>Пока поздравлений нет. Сначала участники должны добавить свои сообщения.</p>
                ) : (
                  <div className={styles.contentCards}>
                    {allContributions.map((contribution, index) => {
                      const overflow = contribution.message.length - layoutProfile.maxChars;
                      const isTooLong = overflow > 0;
                      const isHidden = contribution.status === "hidden";
                      const detailId = `content-card-${contribution.id}`;

                      return (
                        <details
                          key={contribution.id}
                          className={`${styles.contentContributionCard} ${isTooLong ? styles.contentContributionCardWarn : ""}`}
                          open={index === 0}
                        >
                          <summary className={styles.contentContributionSummary} aria-controls={detailId}>
                            <div className={styles.contentContributionLead}>
                              <span className={styles.contentGrip} aria-hidden="true">
                                ⋮⋮
                              </span>
                              <span className={styles.contentOrder}>#{contribution.sortOrder + 1}</span>
                              <div className={styles.contentAvatar}>
                                {contribution.authorName.trim().slice(0, 1).toUpperCase() || "?"}
                              </div>
                              <div className={styles.contentIdentity}>
                                <strong>{contribution.authorName}</strong>
                                <span>{contribution.authorRole?.trim() || "без роли"}</span>
                              </div>
                            </div>

                            <div className={styles.contentContributionMeta}>
                              <span className={isTooLong ? styles.limitWarning : styles.limitOk}>
                                {isTooLong ? `Нужно сократить на ${overflow} символов` : "Длина текста оптимальна"}
                              </span>
                              <span className={`${styles.contentToggleView} ${!isHidden ? styles.contentToggleViewActive : ""}`}>
                                <span className={styles.contentToggleKnob} />
                              </span>
                              <span className={styles.contentChevron} aria-hidden="true">
                                ⌄
                              </span>
                            </div>
                          </summary>

                          <div className={styles.contentContributionBody} id={detailId}>
                            <div className={styles.contentContributionStatusRow}>
                              <span className={styles.contentBodyLabel}>Показывать в открытке</span>
                              <form action={setContributionStatusAction}>
                                <input type="hidden" name="manageToken" value={manageToken} />
                                <input type="hidden" name="contributionId" value={contribution.id} />
                                <input type="hidden" name="status" value={isHidden ? "visible" : "hidden"} />
                                <button
                                  type="submit"
                                  className={`${styles.contentToggleView} ${!isHidden ? styles.contentToggleViewActive : ""}`}
                                  aria-label={isHidden ? "Показать поздравление" : "Скрыть поздравление"}
                                >
                                  <span className={styles.contentToggleKnob} />
                                </button>
                              </form>
                            </div>

                            <ContributionEditor
                              contributionId={contribution.id}
                              manageToken={manageToken}
                              initialMessage={contribution.message}
                              messageLimit={layoutProfile.maxChars}
                            />

                            <div className={styles.contentCardFooter}>
                              <div className={styles.contentActionFormsInline}>
                                <button type="button" className={styles.contentSoftButton}>
                                  ✨ Сократить текст
                                </button>
                                <form action={moveContributionAction}>
                                  <input type="hidden" name="manageToken" value={manageToken} />
                                  <input type="hidden" name="contributionId" value={contribution.id} />
                                  <input type="hidden" name="direction" value="up" />
                                  <button type="submit" className={styles.contentSoftButton}>
                                    Выше
                                  </button>
                                </form>
                                <form action={moveContributionAction}>
                                  <input type="hidden" name="manageToken" value={manageToken} />
                                  <input type="hidden" name="contributionId" value={contribution.id} />
                                  <input type="hidden" name="direction" value="down" />
                                  <button type="submit" className={styles.contentSoftButton}>
                                    Ниже
                                  </button>
                                </form>
                              </div>

                              <form action={setContributionStatusAction}>
                                <input type="hidden" name="manageToken" value={manageToken} />
                                <input type="hidden" name="contributionId" value={contribution.id} />
                                <input type="hidden" name="status" value="deleted" />
                                <button type="submit" className={styles.contentDeleteButton}>
                                  Удалить
                                </button>
                              </form>
                            </div>
                          </div>
                        </details>
                      );
                    })}
                  </div>
                )}

                <section className={styles.contentAssistantCard}>
                  <div>
                    <h3 className={styles.contentAssistantTitle}>AI-помощник</h3>
                    <p className={styles.contentAssistantText}>
                      Может сократить, улучшить стиль, сделать текст теплее или убрать лишнее.
                    </p>
                  </div>
                  <button type="button" className={styles.contentOutlineButton}>
                    Открыть помощника
                  </button>
                </section>
              </section>

              <aside className={styles.contentRail}>
                <section className={styles.contentPreviewCard}>
                  <div className={styles.contentPreviewHeader}>
                    <h2 className={styles.contentRailTitle}>Предпросмотр поздравлений</h2>
                    <p className={styles.previewStatusLine}>
                      <span className={styles.previewStatusDot} />
                      <span>Обновляется автоматически</span>
                    </p>
                  </div>

                  <article className={styles.contentPreviewMessageCard}>
                    <div className={styles.contentPreviewAvatar} />
                    <div className={styles.contentPreviewMessageBody}>
                      <div className={styles.contentPreviewMessageMeta}>
                        <strong>{previewMessage?.authorName || "Дима"}</strong>
                        <span>{previewMessage?.authorRole || "ученик"}</span>
                      </div>
                      <p>
                        {previewMessage?.message.slice(0, 140) ||
                          "Очень хочется сказать вам теплые слова и поблагодарить за добро, которое вы даете людям..."}
                      </p>
                    </div>
                  </article>

                  <div className={styles.contentPreviewPager}>
                    <button type="button" className={styles.contentPagerButton} aria-label="Предыдущее поздравление">
                      ‹
                    </button>
                    <div className={styles.contentPagerDots} aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </div>
                    <button type="button" className={styles.contentPagerButton} aria-label="Следующее поздравление">
                      ›
                    </button>
                  </div>
                </section>

                <MediaManager manageToken={manageToken} mediaAssets={mediaAssets} mediaLayout={mediaLayout} />

                <section className={styles.contentTipsCard}>
                  <h2 className={styles.contentRailTitle}>Подсказки</h2>
                  <ul className={styles.contentTipsList}>
                    <li>Тексты до {layoutProfile.maxChars} символов читаются лучше и выглядят аккуратнее.</li>
                    <li>Перетаскивание поздравлений станет следующим шагом, пока порядок можно менять кнопками.</li>
                    <li>Не забудьте добавить фото — они делают открытку живой и теплой.</li>
                  </ul>
                </section>
              </aside>
            </div>

            <div className={styles.contentFooterBar}>
              <Link href={`/manage/${manageToken}?tab=design`} className={styles.contentBackButton}>
                ← Вернуться к оформлению
              </Link>
              <span className={styles.contentAutosave}>Черновик сохраняется автоматически</span>
              <button type="button" className={styles.contentPrimaryButton}>
                Сохранить изменения
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
