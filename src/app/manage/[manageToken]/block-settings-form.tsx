"use client";

import { useActionState, useMemo, useState } from "react";
import type {
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
  initialShowAllLink: boolean;
};

const initialState = {
  ok: false,
  message: ""
};

const layoutOptions: Array<{
  id: FinalCardMessageLayoutMode;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    id: "grid-2",
    label: "Сетка 2 на 2",
    shortLabel: "2x2",
    description: "Четыре карточки на экране, пролистывание по одному ряду."
  },
  {
    id: "carousel-1",
    label: "Один ряд",
    shortLabel: "1 ряд",
    description: "Карточки идут в одну линию и пролистываются по одной."
  },
  {
    id: "carousel-2",
    label: "Два ряда",
    shortLabel: "2 ряда",
    description: "Шесть карточек на экране, пролистывание по одной колонке."
  },
  {
    id: "column-media",
    label: "Колонка + медиа",
    shortLabel: "1 колонка + фото",
    description: "Слева четыре карточки в колонке с прокруткой вниз, справа фиксированное фото."
  }
];

const mediaLayoutOptions: Array<{
  id: FinalCardMessageMediaLayout;
  label: string;
}> = [
  { id: "portrait", label: "1 вертикальное" },
  { id: "landscape-pair", label: "2 горизонтальных" }
];

const canvasBlockMeta: Record<string, { label: string; size: "hero" | "medium" | "small" | "messages" | "closing" }> = {
  hero: { label: "Обложка", size: "hero" },
  summary: { label: "Вводный блок", size: "medium" },
  qualities: { label: "Качества", size: "small" },
  messages: { label: "Поздравления", size: "messages" },
  memories: { label: "Моменты / фото", size: "medium" },
  quotes: { label: "Лучшие фразы", size: "small" },
  closing: { label: "Финал", size: "closing" }
};

const buildCanvasBlocks = (options: BlockOption[], blockState: Record<string, boolean>) => [
  "hero",
  ...options.filter((option) => !option.disabled && blockState[option.id]).map((option) => option.id),
  "messages",
  "closing"
];

export const BlockSettingsForm = ({
  manageToken,
  options,
  initialLayoutMode,
  initialMediaLayout,
  initialShowAllLink
}: Props) => {
  const [state, formAction, isPending] = useActionState(updateFinalPresentationSettingsAction, initialState);
  const [layoutMode, setLayoutMode] = useState<FinalCardMessageLayoutMode>(initialLayoutMode);
  const [mediaLayout, setMediaLayout] = useState<FinalCardMessageMediaLayout>(initialMediaLayout);
  const [showAllLink, setShowAllLink] = useState(initialShowAllLink);
  const [blockState, setBlockState] = useState<Record<string, boolean>>(
    Object.fromEntries(options.map((option) => [option.id, option.checked]))
  );

  const canvasBlocks = useMemo(() => buildCanvasBlocks(options, blockState), [blockState, options]);
  const currentLayoutLabel = layoutOptions.find((option) => option.id === layoutMode)?.label ?? "Сетка 2 на 2";

  return (
    <form action={formAction} className={styles.studioForm}>
      <input type="hidden" name="manageToken" value={manageToken} />

      <section className={styles.studioCanvasCard}>
        <div className={styles.studioCanvasHeader}>
          <div>
            <p className={styles.eyebrowLabel}>Layout Studio</p>
            <h3 className={styles.studioTitle}>Схема финальной открытки</h3>
          </div>
          <div className={styles.studioCanvasBadges}>
            <span className={styles.infoBadge}>{currentLayoutLabel}</span>
            <span className={styles.infoBadge}>
              {showAllLink ? "Есть кнопка со всеми поздравлениями" : "Без отдельного экрана поздравлений"}
            </span>
          </div>
        </div>

        <div className={styles.canvasPhone}>
          {canvasBlocks.map((blockId) => (
            <div
              key={blockId}
              className={`${styles.canvasBlock} ${styles[`canvasBlock${canvasBlockMeta[blockId].size}`]}`}
            >
              <div className={styles.canvasBlockHeader}>
                <span>{canvasBlockMeta[blockId].label}</span>
                {blockId === "messages" ? (
                  <span className={styles.canvasBlockMeta}>
                    {layoutOptions.find((option) => option.id === layoutMode)?.shortLabel}
                  </span>
                ) : null}
              </div>

              {blockId === "messages" ? (
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
              ) : (
                <div className={styles.canvasBlockFill} />
              )}
            </div>
          ))}
        </div>

        <p className={styles.canvasHint}>
          Это не список блоков, а схема будущей открытки сверху вниз. По ней сразу видно, что окажется выше, ниже и как
          именно устроен блок поздравлений.
        </p>
      </section>

      <section className={styles.studioControlsGrid}>
        <div className={styles.controlCard}>
          <div className={styles.controlHeader}>
            <h3 className={styles.controlTitle}>Формат поздравлений</h3>
            <p className={styles.controlHint}>Компактный выбор основного сценария чтения.</p>
          </div>

          <div className={styles.compactOptionGrid}>
            {layoutOptions.map((option) => (
              <label
                key={option.id}
                className={`${styles.compactOption} ${layoutMode === option.id ? styles.compactOptionActive : ""}`}
              >
                <input
                  type="radio"
                  name="layoutMode"
                  value={option.id}
                  defaultChecked={option.id === initialLayoutMode}
                  onChange={() => setLayoutMode(option.id)}
                />
                <span className={styles.compactOptionTag}>{option.shortLabel}</span>
                <span className={styles.compactOptionTitle}>{option.label}</span>
                <span className={styles.compactOptionDescription}>{option.description}</span>
              </label>
            ))}
          </div>

          {layoutMode === "column-media" ? (
            <div className={styles.inlineSettingsRow}>
              <span className={styles.inlineSettingsLabel}>Медиаблок:</span>
              <div className={styles.inlinePillGroup}>
                {mediaLayoutOptions.map((option) => (
                  <label
                    key={option.id}
                    className={`${styles.inlinePillOption} ${mediaLayout === option.id ? styles.inlinePillOptionActive : ""}`}
                  >
                    <input
                      type="radio"
                      name="mediaLayout"
                      value={option.id}
                      defaultChecked={option.id === initialMediaLayout}
                      onChange={() => setMediaLayout(option.id)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <input type="hidden" name="mediaLayout" value={mediaLayout} />
          )}
        </div>

        <div className={styles.controlCard}>
          <div className={styles.controlHeader}>
            <h3 className={styles.controlTitle}>Блоки открытки</h3>
            <p className={styles.controlHint}>Включаем только то, что усиливает финальный экран.</p>
          </div>

          <div className={styles.toggleGrid}>
            {options.map((option) => (
              <label
                key={option.id}
                className={`${styles.toggleCard} ${option.disabled ? styles.toggleCardDisabled : ""} ${
                  blockState[option.id] ? styles.toggleCardActive : ""
                }`}
              >
                <input
                  type="checkbox"
                  name={option.id}
                  defaultChecked={option.checked}
                  disabled={option.disabled}
                  onChange={(event) =>
                    setBlockState((current) => ({
                      ...current,
                      [option.id]: event.target.checked
                    }))
                  }
                />
                <span className={styles.toggleCardTitle}>{option.label}</span>
                <span className={styles.toggleCardDescription}>{option.description}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.controlCard}>
          <div className={styles.controlHeader}>
            <h3 className={styles.controlTitle}>Дополнительно</h3>
            <p className={styles.controlHint}>Отдельные настройки, не связанные с форматом блока.</p>
          </div>

          <label className={styles.inlineToggle}>
            <input
              type="checkbox"
              name="showAllLink"
              defaultChecked={initialShowAllLink}
              onChange={(event) => setShowAllLink(event.target.checked)}
            />
            <div>
              <strong>Кнопка со всеми поздравлениями</strong>
              <p className={styles.controlHint}>Открывает отдельный экран, где удобно читать сообщения подряд.</p>
            </div>
          </label>

          <div className={styles.stateRow}>
            <span className={styles.stateLabel}>Сейчас:</span>
            <span className={styles.infoBadge}>{showAllLink ? "кнопка включена" : "кнопка выключена"}</span>
          </div>
        </div>
      </section>

      <div className={styles.editorFooter}>
        <button type="submit" className={styles.button} disabled={isPending}>
          {isPending ? "Сохраняем..." : "Сохранить структуру"}
        </button>
        {state.message ? (
          <span className={state.ok ? styles.editorSuccess : styles.editorError}>{state.message}</span>
        ) : null}
      </div>
    </form>
  );
};
