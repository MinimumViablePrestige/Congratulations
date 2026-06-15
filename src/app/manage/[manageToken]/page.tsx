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

const starterSteps = [
  "Укажите, кому и от кого создаётся открытка, чтобы у неё сразу появился понятный контекст.",
  "Настройте состав открытки: какие блоки будут видны и в каком порядке они читаются.",
  "После структуры выберите шаблон и проверьте, как всё выглядит в живом предпросмотре."
];

const managedBlockIds: FinalCardBlockId[] = ["hero", "summary", "qualities", "messages", "quotes", "ai-summary", "closing"];

const layoutModeLabels: Record<string, string> = {
  "grid-2": "Сетка 2 на 2",
  "carousel-1": "Один ряд",
  "carousel-2": "Два ряда",
  "column-media": "Колонка + фото"
};

const blockPreviewLabels: Partial<Record<FinalCardBlockId, string>> = {
  summary: "Вводный блок",
  qualities: "Качества",
  quotes: "Лучшие фразы",
  "ai-summary": "Общее поздравление"
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

  const isBlankBasics =
    !card.recipientName.trim() &&
    !card.fromLabel.trim() &&
    !card.occasionText.trim() &&
    !card.organizerName.trim() &&
    !card.organizerEmail.trim();

  const recipientName = card.recipientName.trim() || "нового получателя";
  const fromLabel = card.fromLabel.trim() || "пока не указано";
  const occasionText = card.occasionText.trim() || "пока не указан";
  const previewRecipient = card.recipientName.trim() || "Кристина";
  const previewFromLabel = card.fromLabel.trim() || "вашей группы";
  const previewOccasion = card.occasionText.trim() || "Повод появится после заполнения основы";
  const previewDescription =
    card.description?.trim() || `Собираем красивую открытку для ${previewRecipient}, где каждое поздравление складывается в один тёплый подарок.`;
  const previewMessages = visibleContributions.slice(0, Math.min(2, layoutProfile.cardsPerPage));
  const previewBlocks = model.blocks.filter((block) => block.id !== "hero" && block.id !== "messages" && block.id !== "closing");
  const visibleBlockCount = model.blocks.length;
  const formattedEventDate = formatEventDate(card.eventDate ?? null);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroTop}>
            <div className={styles.heroContent}>
              <p className={styles.heroBreadcrumbs}>
                <span>Организатор: {card.organizerName.trim() || "не указан"}</span>
                <span>Повод: {occasionText}</span>
              </p>
              <p className={styles.eyebrow}>Секретная страница организатора</p>
              <h1 className={styles.title}>
                {isBlankBasics ? "Новый черновик открытки" : `Открытка для ${recipientName}`}
              </h1>
              <p className={styles.subtitle}>
                Здесь собирается вся открытка целиком: сначала основа и структура, затем шаблон, после этого
                поздравления и фото. Черновик сохраняется в одном понятном месте.
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
              <span className={styles.heroTemplateLabel}>Текущий шаблон</span>
              <strong className={styles.heroTemplateName}>{selectedTemplate.name}</strong>
              <span className={styles.heroTemplateDescription}>{selectedTemplate.description}</span>
              <div
                className={styles.heroTemplatePreview}
                style={{ background: selectedTemplate.accent }}
                aria-hidden="true"
              >
                <div className={styles.heroTemplatePaper}>
                  <span>{previewRecipient}</span>
                </div>
              </div>
              <a href="#template-section" className={styles.secondaryButton}>
                Выбрать другой
              </a>
            </aside>
          </div>
        </section>

        {activeTab === "design" ? (
          <div className={styles.designStudio}>
            <div className={styles.designMain}>
              {isBlankBasics ? (
                <section className={styles.welcomeCard}>
                  <div className={styles.welcomeIntro}>
                    <p className={styles.eyebrow}>С чего начать</p>
                    <h2 className={styles.sectionTitle}>Сначала заполните основу открытки</h2>
                    <p className={styles.hint}>
                      Это новый пустой черновик. Ниже уже подготовлены все шаги: сначала смысл и базовые поля,
                      затем состав открытки и только после этого выбор визуального шаблона.
                    </p>
                  </div>
                  <div className={styles.welcomeSteps}>
                    {starterSteps.map((step, index) => (
                      <article key={step} className={styles.welcomeStep}>
                        <span className={styles.welcomeStepNumber}>0{index + 1}</span>
                        <p className={styles.previewText}>{step}</p>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className={styles.panel} id="basics-section">
                <div className={styles.panelHeader}>
                  <div>
                    <p className={styles.eyebrow}>Шаг 1</p>
                    <h2 className={styles.sectionTitle}>Основа открытки</h2>
                  </div>
                  <p className={styles.hint}>
                    Заполните имя получателя, повод, организатора и короткое описание. Если ошиблись раньше, всё можно
                    поправить здесь без возврата на отдельный экран.
                  </p>
                </div>

                <BasicsSettingsForm manageToken={manageToken} card={card} />
              </section>

              <section className={styles.studioPanel} id="composition-section">
                <div className={styles.studioPanelHeader}>
                  <div>
                    <p className={styles.eyebrow}>Шаг 2</p>
                    <h2 className={styles.sectionTitle}>Состав открытки</h2>
                  </div>
                  <p className={styles.studioLead}>
                    Здесь вы управляете самим сценарием открытки: какие блоки останутся, в каком порядке они идут и
                    как будут выглядеть поздравления. Обложка и финал всегда закреплены по краям.
                  </p>
                </div>

                <BlockSettingsForm
                  manageToken={manageToken}
                  options={blockOptions}
                  initialLayoutMode={layoutMode}
                  initialMediaLayout={mediaLayout}
                  initialBlockOrder={initialBlockOrder}
                />
              </section>

              <section className={styles.panel} id="template-section">
                <div className={styles.panelHeader}>
                  <div>
                    <p className={styles.eyebrow}>Шаг 3</p>
                    <h2 className={styles.sectionTitle}>Шаблон и настроение</h2>
                  </div>
                  <p className={styles.hint}>
                    Шаблон выбирается после структуры. Так проще смотреть все варианты и принимать решение уже на
                    готовом составе открытки, а не вслепую.
                  </p>
                </div>

                <TemplateSettingsForm
                  manageToken={manageToken}
                  templates={cardTemplates}
                  initialTemplateId={selectedTemplate.id}
                  initialLayoutMode={layoutMode}
                  initialMediaLayout={mediaLayout}
                  initialBlockOrder={initialBlockOrder}
                  blockState={blockState}
                />
              </section>
            </div>

            <aside className={styles.designRail}>
              <section className={styles.previewPanel}>
                <div className={styles.previewPanelHeader}>
                  <div>
                    <h2 className={styles.sectionTitle}>Предпросмотр</h2>
                    <p className={styles.hint}>Показывает общий ритм открытки и обновляется после сохранения настроек.</p>
                  </div>
                  <span className={styles.previewStatus}>● Автосохранение черновика</span>
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
                    <section className={styles.previewMockHero}>
                      <div className={styles.previewFloralGlow} />
                      <div className={styles.previewMockTop}>
                        <span className={styles.previewMockEyebrow}>Открытка для тебя</span>
                        <h3 className={styles.previewMockTitle}>{previewRecipient}</h3>
                        <p className={styles.previewMockSubtitle}>{previewDescription}</p>
                      </div>

                      <div className={styles.previewMockOccasion}>
                        <strong>{previewOccasion}</strong>
                        <span>
                          от {previewFromLabel}
                          {formattedEventDate ? ` • ${formattedEventDate}` : ""}
                        </span>
                      </div>
                    </section>

                    {previewBlocks.slice(0, 2).map((block) => (
                      <section key={block.id} className={styles.previewMiniSection}>
                        <span className={styles.previewMiniLabel}>
                          {blockPreviewLabels[block.id] ?? "Дополнительный блок"}
                        </span>
                        <p className={styles.previewMiniText}>
                          {block.id === "summary"
                            ? previewDescription
                            : block.id === "qualities"
                              ? model.qualities.slice(0, 3).join(" • ") || "Тепло • внимание • поддержка"
                              : block.id === "quotes"
                                ? model.quotes[0] || "Здесь появится одна из самых тёплых фраз."
                                : model.aiSummaryText}
                        </p>
                      </section>
                    ))}

                    <section className={styles.previewMessagesSection}>
                      <div className={styles.previewMessagesHeader}>
                        <span>Поздравления</span>
                        <span>{visibleContributions.length}</span>
                      </div>

                      <div className={styles.previewMessagesList}>
                        {(previewMessages.length > 0 ? previewMessages : [null, null]).map((item, index) => (
                          <article key={item?.id ?? `empty-${index}`} className={styles.previewMessageCard}>
                            <div className={styles.previewAvatar} />
                            <div className={styles.previewMessageBody}>
                              <strong>{item?.authorName ?? "Участник"}</strong>
                              <p>
                                {item?.message.slice(0, 92) ??
                                  "Первое поздравление появится здесь, когда участники начнут добавлять свои слова."}
                              </p>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>

                    <section className={styles.previewClosing}>
                      <span>Спасибо, что вы вместе</span>
                    </section>
                  </article>
                </div>

                <Link href={`/gift/${card.finalSlug}`} target="_blank" className={styles.previewLinkButton}>
                  Открыть полный просмотр
                </Link>
              </section>

              <section className={styles.actionsCard}>
                <h2 className={styles.sectionTitle}>Быстрый срез</h2>
                <div className={styles.summaryList}>
                  <p className={styles.previewText}>
                    Шаблон: <strong>{selectedTemplate.name}</strong>
                  </p>
                  <p className={styles.previewText}>
                    Видимых блоков: <strong>{visibleBlockCount}</strong>
                  </p>
                  <p className={styles.previewText}>
                    Лимит карточки в текущей сетке: <strong>{layoutProfile.maxChars}</strong> символов
                  </p>
                  <p className={styles.previewText}>
                    {showAllLink
                      ? "Если поздравлений станет много, откроется отдельный экран со всеми сообщениями."
                      : "Все поздравления пока помещаются в основную открытку без отдельного экрана."}
                  </p>
                </div>
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
                            {isTooLong
                              ? `Нужно сократить на ${overflow} символов`
                              : "Карточка укладывается в текущий формат"}
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
