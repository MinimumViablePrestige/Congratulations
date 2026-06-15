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
    label: 'Сетка "2 на 2"',
    description: "На первом экране видно 4 карточки, дальше можно листать."
  },
  {
    id: "carousel-1",
    label: "Один ряд",
    description: "Карточки идут в одну линию и читаются как лента."
  },
  {
    id: "carousel-2",
    label: "Два ряда",
    description: "Более плотная сетка, когда хочется показать больше поздравлений сразу."
  },
  {
    id: "column-media",
    label: "Колонка + фото",
    description: "Слева идут поздравления, справа закрепляется отдельный фотоблок."
  }
];

const mediaLayoutOptions: Array<{
  id: FinalCardMessageMediaLayout;
  label: string;
}> = [
  { id: "portrait", label: "1 вертикальное фото" },
  { id: "landscape-pair", label: "2 горизонтальных фото" }
];

const canvasBlockMeta: Record<
  FinalCardBlockId,
  {
    label: string;
    size: "hero" | "medium" | "small" | "messages" | "closing";
    description: string;
  }
> = {
  hero: {
    label: "Обложка",
    size: "hero",
    description:
      "Первый экран с именем получателя, поводом и общим настроением открытки. Является обязательным."
  },
  summary: {
    label: "Вводный блок",
    size: "medium",
    description: "Коротко объясняет, по какому поводу собрана открытка. Сейчас блок включен в открытку."
  },
  qualities: {
    label: "Качества",
    size: "small",
    description: "Подсвечивает, за что именно любят и ценят человека. Сейчас блок включен в открытку."
  },
  messages: {
    label: "Поздравления",
    size: "messages",
    description: "Главный блок с карточками участников. Является обязательным."
  },
  memories: {
    label: "Моменты / фото",
    size: "medium",
    description: "Блок временно скрыт из конструктора."
  },
  quotes: {
    label: "Лучшие фразы",
    size: "small",
    description: "Выносит самые сильные короткие строки из поздравлений. Сейчас блок включен в открытку."
  },
  "ai-summary": {
    label: "Общее поздравление",
    size: "medium",
    description: "Собирает общий голос группы в один сводный аккорд. Сейчас блок включен в открытку."
  },
  closing: {
    label: "Финал",
    size: "closing",
    description: "Завершает открытку и собирает общее ощущение подарка. Является обязательным."
  }
};

const requiredBlockIds: FinalCardBlockId[] = ["hero", "messages", "closing"];
const fixedBlockIds: FinalCardBlockId[] = ["hero", "closing"];

const buildCanvasBlocks = (options: BlockOption[], blockState: Record<string, boolean>): RenderedBlock[] => [
  {
    id: "hero",
    label: canvasBlockMeta.hero.label,
    description: canvasBlockMeta.hero.description,
    removable: false
  },
  ...options
    .filter((option) => !option.disabled && blockState[option.id])
    .map((option) => ({
      id: option.id as FinalCardBlockId,
      label: option.label,
      description: canvasBlockMeta[option.id].description,
      removable: true
    })),
  {
    id: "messages",
    label: canvasBlockMeta.messages.label,
    description: canvasBlockMeta.messages.description,
    removable: false
  },
  {
    id: "closing",
    label: canvasBlockMeta.closing.label,
    description: canvasBlockMeta.closing.description,
    removable: false
  }
];

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

  const activeBlocks = useMemo(() => buildCanvasBlocks(options, blockState), [blockState, options]);

  const canvasBlocks = useMemo(() => {
    const activeMap = new Map(activeBlocks.map((block) => [block.id, block]));
    return blockOrder
      .map((blockId) => activeMap.get(blockId))
      .filter((block): block is RenderedBlock => Boolean(block));
  }, [activeBlocks, blockOrder]);

  const currentLayoutLabel = layoutOptions.find((option) => option.id === layoutMode)?.label ?? 'Сетка "2 на 2"';

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

  const handleDragStart = (event: ReactDragEvent<HTMLSpanElement>, blockId: FinalCardBlockId) => {
    setDraggedBlockId(blockId);
    setDropTarget(null);
    event.dataTransfer.effectAllowed = "move";

    const blockCard = event.currentTarget.closest("article");

    if (blockCard instanceof HTMLElement) {
      const rect = blockCard.getBoundingClientRect();
      event.dataTransfer.setDragImage(blockCard, rect.width / 2, 32);
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
        <div className={styles.studioCanvasHeader}>
          <div>
            <p className={styles.eyebrowLabel}>Шаг 2</p>
            <h3 className={styles.studioTitle}>Состав открытки</h3>
          </div>
          <div className={styles.studioCanvasBadges}>
            <span className={styles.infoBadge}>{currentLayoutLabel}</span>
          </div>
        </div>

        <div className={styles.canvasPhone}>
          {canvasBlocks.map((block) => (
            <article
              key={block.id}
              className={[
                styles.canvasBlock,
                styles[`canvasBlock${canvasBlockMeta[block.id].size}`],
                draggedBlockId === block.id ? styles.canvasBlockDragging : "",
                dropTarget?.blockId === block.id ? styles.canvasBlockDropTarget : "",
                dropTarget?.blockId === block.id && dropTarget.position === "before" ? styles.canvasBlockDropBefore : "",
                dropTarget?.blockId === block.id && dropTarget.position === "after" ? styles.canvasBlockDropAfter : "",
                fixedBlockIds.includes(block.id) ? styles.canvasBlockFixed : ""
              ]
                .filter(Boolean)
                .join(" ")}
              onDragOver={(event) => handleDragOver(event, block.id)}
              onDragLeave={(event) => handleDragLeave(event, block.id)}
              onDrop={(event) => handleDrop(event, block.id)}
            >
              <div className={styles.canvasBlockHeader}>
                <div className={styles.canvasBlockHeading}>
                  <span>{block.label}</span>
                  {fixedBlockIds.includes(block.id) ? (
                    <span className={styles.canvasFixedBadge}>Фиксирован</span>
                  ) : (
                    <span
                      className={styles.canvasDragHandle}
                      draggable
                      onDragStart={(event) => handleDragStart(event, block.id)}
                      onDragEnd={() => {
                        setDraggedBlockId(null);
                        setDropTarget(null);
                      }}
                      title="Перетащите, чтобы изменить порядок"
                      aria-label={`Перетащите блок ${block.label}, чтобы изменить порядок`}
                    >
                      ⋮⋮
                    </span>
                  )}
                </div>
                {block.removable ? (
                  <button
                    type="button"
                    className={styles.blockCardRemove}
                    onClick={() =>
                      setBlockState((current) => ({
                        ...current,
                        [block.id]: false
                      }))
                    }
                    aria-label={`Убрать блок ${block.label}`}
                  >
                    ×
                  </button>
                ) : null}
              </div>

              <p className={styles.canvasBlockDescription}>{block.description}</p>

              {block.id === "messages" ? (
                <div className={styles.messagesCardControls}>
                  <div className={styles.layoutChoiceGrid}>
                    {layoutOptions.map((option) => {
                      const profile = getFinalCardMessageLayoutProfile(option.id);

                      return (
                        <button
                          key={option.id}
                          type="button"
                          className={`${styles.layoutChoiceCard} ${layoutMode === option.id ? styles.layoutChoiceCardActive : ""}`}
                          onClick={() => setLayoutMode(option.id)}
                        >
                          <span className={styles.layoutChoiceTitle}>{option.label}</span>
                          <span className={styles.layoutChoiceDescription}>{option.description}</span>
                          <span className={styles.compactOptionMeta}>До {profile.maxChars} символов на карточку</span>
                        </button>
                      );
                    })}
                  </div>

                  {layoutMode === "column-media" ? (
                    <div className={styles.inlineSettingsStack}>
                      <span className={styles.inlineSettingsLabel}>Как выглядит медиаблок рядом:</span>
                      <div className={styles.inlinePillGroup}>
                        {mediaLayoutOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            className={`${styles.inlinePillOption} ${mediaLayout === option.id ? styles.inlinePillOptionActive : ""}`}
                            onClick={() => setMediaLayout(option.id)}
                          >
                            <span>{option.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className={styles.messageLayoutPreview} data-layout={layoutMode}>
                    {layoutMode === "grid-2" ? (
                      <>
                        <span className={styles.messageSlot}>1</span>
                        <span className={styles.messageSlot}>2</span>
                        <span className={styles.messageSlot}>3</span>
                        <span className={styles.messageSlot}>4</span>
                      </>
                    ) : null}

                    {layoutMode === "carousel-1" ? (
                      <>
                        <span className={styles.messageSlotWide}>1</span>
                        <span className={styles.messageSlotWide}>2</span>
                        <span className={styles.messageSlotWide}>3</span>
                        <span className={styles.scrollHint}>↔</span>
                      </>
                    ) : null}

                    {layoutMode === "carousel-2" ? (
                      <>
                        <div className={styles.messageSlotColumn}>
                          <span className={styles.messageSlot}>1</span>
                          <span className={styles.messageSlot}>2</span>
                        </div>
                        <div className={styles.messageSlotColumn}>
                          <span className={styles.messageSlot}>3</span>
                          <span className={styles.messageSlot}>4</span>
                        </div>
                        <span className={styles.scrollHint}>↔</span>
                      </>
                    ) : null}

                    {layoutMode === "column-media" ? (
                      <>
                        <div className={styles.columnMediaMessages}>
                          <span className={styles.messageSlotTall}>1</span>
                          <span className={styles.messageSlotTall}>2</span>
                          <span className={styles.messageSlotTall}>3</span>
                          <span className={styles.messageSlotTall}>4</span>
                        </div>
                        <div className={styles.columnMediaAside}>
                          {mediaLayout === "portrait" ? (
                            <span className={styles.mediaSlotPortrait}>Фото</span>
                          ) : (
                            <>
                              <span className={styles.mediaSlotLandscape}>Фото A</span>
                              <span className={styles.mediaSlotLandscape}>Фото B</span>
                            </>
                          )}
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className={styles.canvasBlockFill} />
              )}
            </article>
          ))}
        </div>

        <div className={styles.restoreZone}>
          <div className={styles.restoreZoneHeader}>
            <h4 className={styles.restoreZoneTitle}>Убранные блоки, которые можно восстановить</h4>
            <p className={styles.controlHint}>
              Если что-то убрали и передумали, блок возвращается отсюда без переходов назад.
            </p>
          </div>

          {removedOptionalBlocks.length === 0 ? (
            <p className={styles.empty}>
              Сейчас ничего не убрано. Все доступные дополнительные блоки уже в составе открытки.
            </p>
          ) : (
            <div className={styles.restoreChipList}>
              {removedOptionalBlocks.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`${styles.restoreChip} ${option.disabled ? styles.restoreChipDisabled : ""}`}
                  onClick={() =>
                    setBlockState((current) => ({
                      ...current,
                      [option.id]: true
                    }))
                  }
                  disabled={option.disabled}
                >
                  <span className={styles.restoreChipLabel}>Вернуть {option.label}</span>
                  <span className={styles.restoreChipDescription}>
                    {option.disabled ? "Сначала нужен контент для этого блока." : option.description}
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
