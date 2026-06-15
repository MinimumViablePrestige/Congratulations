"use client";

import { useActionState, useMemo, useState, type DragEvent as ReactDragEvent } from "react";
import { getFinalCardMessageLayoutProfile } from "@/lib/final-card/message-layout-rules";
import type {
  FinalCardBlockId,
  FinalCardMessageLayoutMode,
  FinalCardMessageMediaLayout,
  FinalCardOptionalBlockId
} from "@/lib/final-card/types";
import { updateFinalPresentationSettingsAction } from "./actions";
import styles from "./manage-page.module.css";

type BlockOption = {
  id: FinalCardOptionalBlockId;
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
};

type Props = {
  manageToken: string;
  options: BlockOption[];
  initialLayoutMode: FinalCardMessageLayoutMode;
  initialMediaLayout: FinalCardMessageMediaLayout;
  initialBlockOrder: FinalCardBlockId[];
};

type RenderedBlock = {
  id: FinalCardBlockId;
  label: string;
  description: string;
  removable: boolean;
};

type DropTarget = {
  blockId: FinalCardBlockId;
  position: "before" | "after";
};

type ExpandedState = Partial<Record<FinalCardBlockId, boolean>>;

const initialState = {
  ok: false,
  message: ""
};

const layoutOptions: Array<{
  id: FinalCardMessageLayoutMode;
  label: string;
  description: string;
}> = [
  {
    id: "grid-2",
    label: "Сетка 2 на 2",
    description: "Карточки стоят компактной сеткой 2х2."
  },
  {
    id: "carousel-1",
    label: "Один ряд",
    description: "Все карточки идут в одну горизонтальную ленту."
  },
  {
    id: "carousel-2",
    label: "Два ряда",
    description: "Карточки читаются в две полосы, плотнее и короче."
  },
  {
    id: "column-media",
    label: "Колонка + фото",
    description: "Слева поздравления, справа закреплённый фотоблок."
  }
];

const mediaLayoutOptions: Array<{
  id: FinalCardMessageMediaLayout;
  label: string;
}> = [
  { id: "portrait", label: "1 Вертикальное фото" },
  { id: "landscape-pair", label: "2 Горизонтальных фото" }
];

const blockMeta: Record<
  FinalCardBlockId,
  {
    label: string;
    icon: string;
    summary: string;
    details: string;
    fixed?: boolean;
  }
> = {
  hero: {
    label: "Обложка",
    icon: "О",
    summary: "Первый экран с именем получателя и настроением открытки.",
    details: "Обязательный блок. Он открывает открытку и задаёт первое впечатление."
  },
  summary: {
    label: "Вводный блок",
    icon: "В",
    summary: "Коротко объясняет, по какому поводу собрана открытка.",
    details: "Подходит для контекста, пояснения ситуации или короткого вступления от группы."
  },
  qualities: {
    label: "Качества",
    icon: "К",
    summary: "Показывает, за что именно любят и ценят человека.",
    details: "Собирает повторяющиеся тёплые слова и превращает их в отдельный ритмичный блок."
  },
  messages: {
    label: "Поздравления",
    icon: "П",
    summary: "Главный блок с карточками участников.",
    details: "Обязательный блок. Здесь настраивается сетка поздравлений и медиаблок рядом с ними."
  },
  memories: {
    label: "Моменты / фото",
    icon: "Ф",
    summary: "Блок временно скрыт из конструктора.",
    details: "Сейчас не используется в этой версии конструктора."
  },
  quotes: {
    label: "Лучшие фразы",
    icon: "Ц",
    summary: "Выносит самые сильные короткие строки из поздравлений.",
    details: "Работает как эмоциональная пауза между основными частями открытки."
  },
  "ai-summary": {
    label: "Общее поздравление",
    icon: "А",
    summary: "Собирает общий голос группы в один сводный аккорд.",
    details: "Подходит для общего финального абзаца, когда хочется объединить настроение всех поздравлений."
  },
  closing: {
    label: "Финал",
    icon: "Ф",
    summary: "Завершает открытку и собирает общее ощущение подарка.",
    details: "Обязательный блок. Он фиксирует тёплое завершение сценария."
  }
};

const requiredBlockIds: FinalCardBlockId[] = ["hero", "messages", "closing"];
const fixedBlockIds: FinalCardBlockId[] = ["hero", "closing"];

const buildCanvasBlocks = (options: BlockOption[], blockState: Record<string, boolean>): RenderedBlock[] => [
  {
    id: "hero",
    label: blockMeta.hero.label,
    description: blockMeta.hero.summary,
    removable: false
  },
  ...options
    .filter((option) => !option.disabled && blockState[option.id])
    .map((option) => ({
      id: option.id as FinalCardBlockId,
      label: option.label,
      description: blockMeta[option.id].summary,
      removable: true
    })),
  {
    id: "messages",
    label: blockMeta.messages.label,
    description: blockMeta.messages.summary,
    removable: false
  },
  {
    id: "closing",
    label: blockMeta.closing.label,
    description: blockMeta.closing.summary,
    removable: false
  }
];

const initialExpandedState: ExpandedState = {
  hero: false,
  summary: false,
  qualities: false,
  messages: true,
  quotes: false,
  "ai-summary": false,
  closing: false
};

export const BlockSettingsForm = ({
  manageToken,
  options,
  initialLayoutMode,
  initialMediaLayout,
  initialBlockOrder
}: Props) => {
  const [state, formAction, isPending] = useActionState(updateFinalPresentationSettingsAction, initialState);
  const [layoutMode, setLayoutMode] = useState<FinalCardMessageLayoutMode>(initialLayoutMode);
  const [mediaLayout, setMediaLayout] = useState<FinalCardMessageMediaLayout>(initialMediaLayout);
  const [blockState, setBlockState] = useState<Record<string, boolean>>(
    Object.fromEntries(options.map((option) => [option.id, option.checked]))
  );
  const [blockOrder, setBlockOrder] = useState<FinalCardBlockId[]>(initialBlockOrder);
  const [draggedBlockId, setDraggedBlockId] = useState<FinalCardBlockId | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [expandedBlocks, setExpandedBlocks] = useState<ExpandedState>(initialExpandedState);

  const activeBlocks = useMemo(() => buildCanvasBlocks(options, blockState), [blockState, options]);

  const canvasBlocks = useMemo(() => {
    const activeMap = new Map(activeBlocks.map((block) => [block.id, block]));
    return blockOrder
      .map((blockId) => activeMap.get(blockId))
      .filter((block): block is RenderedBlock => Boolean(block));
  }, [activeBlocks, blockOrder]);

  const removedOptionalBlocks = blockOrder
    .filter((blockId) => !requiredBlockIds.includes(blockId) && !blockState[blockId])
    .map((blockId) => options.find((option) => option.id === blockId))
    .filter((option): option is BlockOption => Boolean(option));

  const resolveDropPosition = (
    targetBlockId: FinalCardBlockId,
    pointerPosition: "before" | "after"
  ): "before" | "after" => {
    if (targetBlockId === "hero") {
      return "after";
    }

    if (targetBlockId === "closing") {
      return "before";
    }

    return pointerPosition;
  };

  const moveBlock = (targetBlockId: FinalCardBlockId, pointerPosition: "before" | "after") => {
    if (!draggedBlockId || draggedBlockId === targetBlockId) {
      return;
    }

    const targetPosition = resolveDropPosition(targetBlockId, pointerPosition);

    setBlockOrder((current) => {
      const withoutDragged = current.filter((blockId) => blockId !== draggedBlockId);
      const targetIndex = withoutDragged.indexOf(targetBlockId);

      if (targetIndex === -1) {
        return current;
      }

      const next = [...withoutDragged];
      const insertIndex = targetPosition === "after" ? targetIndex + 1 : targetIndex;
      next.splice(insertIndex, 0, draggedBlockId);
      return next;
    });

    setDraggedBlockId(null);
    setDropTarget(null);
  };

  const handleDragStart = (event: ReactDragEvent<HTMLButtonElement>, blockId: FinalCardBlockId) => {
    setDraggedBlockId(blockId);
    setDropTarget(null);
    event.dataTransfer.effectAllowed = "move";

    const blockCard = event.currentTarget.closest("article");

    if (blockCard instanceof HTMLElement) {
      const rect = blockCard.getBoundingClientRect();
      event.dataTransfer.setDragImage(blockCard, rect.width / 2, 36);
    }
  };

  const handleDragOver = (event: ReactDragEvent<HTMLElement>, blockId: FinalCardBlockId) => {
    if (!draggedBlockId || draggedBlockId === blockId) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    const rect = event.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const pointerPosition = event.clientY < midpoint ? "before" : "after";
    const targetPosition = resolveDropPosition(blockId, pointerPosition);

    setDropTarget((current) => {
      if (current?.blockId === blockId && current.position === targetPosition) {
        return current;
      }

      return { blockId, position: targetPosition };
    });
  };

  const handleDragLeave = (event: ReactDragEvent<HTMLElement>, blockId: FinalCardBlockId) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }

    setDropTarget((current) => (current?.blockId === blockId ? null : current));
  };

  const handleDrop = (event: ReactDragEvent<HTMLElement>, blockId: FinalCardBlockId) => {
    event.preventDefault();

    if (!draggedBlockId || draggedBlockId === blockId || !dropTarget || dropTarget.blockId !== blockId) {
      setDropTarget(null);
      return;
    }

    moveBlock(blockId, dropTarget.position);
  };

  const toggleExpanded = (blockId: FinalCardBlockId) => {
    setExpandedBlocks((current) => ({
      ...current,
      [blockId]: !current[blockId]
    }));
  };

  const toggleBlock = (blockId: FinalCardBlockId, checked: boolean) => {
    setBlockState((current) => ({
      ...current,
      [blockId]: checked
    }));
  };

  return (
    <form action={formAction} className={styles.studioForm}>
      <input type="hidden" name="manageToken" value={manageToken} />
      <input type="hidden" name="layoutMode" value={layoutMode} />
      <input type="hidden" name="mediaLayout" value={mediaLayout} />

      {blockOrder.map((blockId) => (
        <input key={blockId} type="hidden" name="blockOrder" value={blockId} />
      ))}

      {options.map((option) => (
        <input key={option.id} type="hidden" name={option.id} value={blockState[option.id] ? "on" : ""} />
      ))}

      <section className={styles.studioCanvasCard}>
        <div className={styles.studioCanvasIntro}>
          <p className={styles.studioLead}>
            Перетаскивайте блоки, чтобы менять их порядок. Обязательные блоки отключить нельзя.
          </p>
          <button type="button" className={styles.inlineHelpLink}>
            Как это работает?
          </button>
        </div>

        <div className={styles.compositionList}>
          {canvasBlocks.map((block) => {
            const isExpanded = Boolean(expandedBlocks[block.id]);
            const isFixed = fixedBlockIds.includes(block.id);
            const isEnabled = isFixed || blockState[block.id];

            return (
              <article
                key={block.id}
                className={[
                  styles.compositionCard,
                  draggedBlockId === block.id ? styles.compositionCardDragging : "",
                  dropTarget?.blockId === block.id ? styles.compositionCardDropTarget : "",
                  dropTarget?.blockId === block.id && dropTarget.position === "before" ? styles.compositionCardDropBefore : "",
                  dropTarget?.blockId === block.id && dropTarget.position === "after" ? styles.compositionCardDropAfter : "",
                  isExpanded ? styles.compositionCardExpanded : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
                onDragOver={(event) => handleDragOver(event, block.id)}
                onDragLeave={(event) => handleDragLeave(event, block.id)}
                onDrop={(event) => handleDrop(event, block.id)}
              >
                <div className={styles.compositionCardTop}>
                  <div className={styles.compositionCardLead}>
                    <button
                      type="button"
                      className={styles.compositionDragHandle}
                      draggable={!isFixed}
                      disabled={isFixed}
                      onDragStart={(event) => handleDragStart(event, block.id)}
                      onDragEnd={() => {
                        setDraggedBlockId(null);
                        setDropTarget(null);
                      }}
                      aria-label={isFixed ? `${block.label} зафиксирован` : `Перетащить блок ${block.label}`}
                    >
                      ⋮⋮
                    </button>

                    <span className={styles.compositionBlockIcon}>{blockMeta[block.id].icon}</span>

                    <div className={styles.compositionBlockText}>
                      <div className={styles.compositionBlockTitleRow}>
                        <strong>{block.label}</strong>
                        <span className={styles.compositionBlockStatus}>
                          {isFixed || block.id === "messages" ? "Обязательный" : "Включён"}
                        </span>
                      </div>
                      <p className={styles.compositionBlockSummary}>{block.description}</p>
                    </div>
                  </div>

                  <div className={styles.compositionCardActions}>
                    {block.removable ? (
                      <button
                        type="button"
                        className={`${styles.toggleSwitch} ${isEnabled ? styles.toggleSwitchActive : ""}`}
                        onClick={() => toggleBlock(block.id, !isEnabled)}
                        aria-pressed={isEnabled}
                        aria-label={isEnabled ? `Убрать блок ${block.label}` : `Вернуть блок ${block.label}`}
                      >
                        <span className={styles.toggleKnob} />
                      </button>
                    ) : null}

                    <button
                      type="button"
                      className={styles.compositionExpandButton}
                      onClick={() => toggleExpanded(block.id)}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? `Свернуть блок ${block.label}` : `Развернуть блок ${block.label}`}
                    >
                      {isExpanded ? "⌃" : "⌄"}
                    </button>
                  </div>
                </div>

                {isExpanded ? (
                  <div className={styles.compositionCardBody}>
                    <p className={styles.compositionBlockDetails}>{blockMeta[block.id].details}</p>

                    {block.id === "messages" ? (
                      <div className={styles.messagesConfigurator}>
                        <div className={styles.messagesConfiguratorGroup}>
                          <span className={styles.messagesConfiguratorLabel}>Выберите вид отображения поздравлений</span>
                          <div className={styles.layoutPresetGrid}>
                            {layoutOptions.map((option) => {
                              const profile = getFinalCardMessageLayoutProfile(option.id);

                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  className={`${styles.layoutPresetCard} ${layoutMode === option.id ? styles.layoutPresetCardActive : ""}`}
                                  onClick={() => setLayoutMode(option.id)}
                                >
                                  <span className={styles.layoutPresetTitle}>{option.label}</span>
                                  <span className={styles.layoutPresetHint}>{option.description}</span>
                                  <span className={styles.layoutPresetMeta}>До {profile.maxChars} символов</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {layoutMode === "column-media" ? (
                          <div className={styles.messagesConfiguratorGroup}>
                            <span className={styles.messagesConfiguratorLabel}>
                              Как выглядит медиаблок рядом с поздравлением
                            </span>
                            <div className={styles.mediaLayoutPills}>
                              {mediaLayoutOptions.map((option) => (
                                <button
                                  key={option.id}
                                  type="button"
                                  className={`${styles.mediaLayoutPill} ${mediaLayout === option.id ? styles.mediaLayoutPillActive : ""}`}
                                  onClick={() => setMediaLayout(option.id)}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        <div className={styles.restoreZone}>
          <div className={styles.restoreZoneHeader}>
            <h4 className={styles.restoreZoneTitle}>Добавить необязательный блок</h4>
            <p className={styles.controlHint}>Удалённые блоки можно вернуть отсюда в любой момент.</p>
          </div>

          {removedOptionalBlocks.length === 0 ? (
            <p className={styles.empty}>Сейчас все доступные дополнительные блоки уже включены в открытку.</p>
          ) : (
            <div className={styles.restoreChipList}>
              {removedOptionalBlocks.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`${styles.restoreChip} ${option.disabled ? styles.restoreChipDisabled : ""}`}
                  onClick={() => toggleBlock(option.id, true)}
                  disabled={option.disabled}
                >
                  <span className={styles.restoreChipIcon}>{blockMeta[option.id].icon}</span>
                  <span className={styles.restoreChipText}>
                    <span className={styles.restoreChipLabel}>{option.label}</span>
                    <span className={styles.restoreChipDescription}>
                      {option.disabled ? "Сначала нужен контент для этого блока." : option.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className={styles.editorFooter}>
        <button type="submit" className={styles.button} disabled={isPending}>
          {isPending ? "Сохраняем..." : "Сохранить состав открытки"}
        </button>
        {state.message ? (
          <span className={state.ok ? styles.editorSuccess : styles.editorError}>{state.message}</span>
        ) : null}
      </div>
    </form>
  );
};
