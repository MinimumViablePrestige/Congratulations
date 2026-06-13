"use client";

import { useActionState, useMemo, useState } from "react";
import type { FinalCardMessageLayoutMode, FinalCardOptionalBlockId } from "@/lib/final-card/types";
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
  initialShowAllLink: boolean;
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
    label: "Две колонки",
    description: "Спокойная сетка без прокрутки. Подходит, когда поздравлений немного."
  },
  {
    id: "carousel-1",
    label: "Один ряд с прокруткой",
    description: "Каждое поздравление видно целиком, а дальше можно пролистывать горизонтально."
  },
  {
    id: "carousel-2",
    label: "Два ряда с прокруткой",
    description: "Более плотная подача: по две карточки в колонке, колонок может быть много."
  }
];

const blockPreviewLabels: Record<string, string> = {
  hero: "Обложка",
  summary: "Вводный блок",
  qualities: "Качества",
  messages: "Поздравления",
  memories: "Воспоминания",
  quotes: "Лучшие фразы",
  closing: "Финал"
};

export const BlockSettingsForm = ({
  manageToken,
  options,
  initialLayoutMode,
  initialShowAllLink
}: Props) => {
  const [state, formAction, isPending] = useActionState(updateFinalPresentationSettingsAction, initialState);
  const [layoutMode, setLayoutMode] = useState<FinalCardMessageLayoutMode>(initialLayoutMode);
  const [showAllLink, setShowAllLink] = useState(initialShowAllLink);
  const [blockState, setBlockState] = useState<Record<string, boolean>>(
    Object.fromEntries(options.map((option) => [option.id, option.checked]))
  );

  const enabledBlocks = useMemo(
    () =>
      [
        "hero",
        ...options.filter((option) => !option.disabled && blockState[option.id]).map((option) => option.id),
        "messages",
        "closing"
      ].map((id) => blockPreviewLabels[id]),
    [blockState, options]
  );

  return (
    <form action={formAction} className={styles.blockForm}>
      <input type="hidden" name="manageToken" value={manageToken} />

      <div className={styles.previewScheme}>
        <div className={styles.previewSchemeHeader}>
          <strong>Схема открытки</strong>
          <span className={styles.previewSchemeMeta}>
            {layoutMode === "grid-2" ? "Сетка 2 колонки" : layoutMode === "carousel-1" ? "1 ряд с прокруткой" : "2 ряда с прокруткой"}
          </span>
        </div>

        <div className={styles.previewStructure}>
          {enabledBlocks.map((label) => (
            <div key={label} className={styles.previewStructureBlock}>
              {label}
            </div>
          ))}
        </div>

        <div className={styles.previewMessagesMock} data-layout={layoutMode}>
          {layoutMode === "grid-2" ? (
            <>
              <span className={styles.previewMessageCard}>Поздравление</span>
              <span className={styles.previewMessageCard}>Поздравление</span>
              <span className={styles.previewMessageCard}>Поздравление</span>
              <span className={styles.previewMessageCard}>Поздравление</span>
            </>
          ) : layoutMode === "carousel-1" ? (
            <>
              <span className={styles.previewMessageCard}>Карточка 1</span>
              <span className={styles.previewMessageCard}>Карточка 2</span>
              <span className={styles.previewMessageCard}>Карточка 3</span>
            </>
          ) : (
            <>
              <div className={styles.previewMessageColumn}>
                <span className={styles.previewMessageCard}>Карточка 1</span>
                <span className={styles.previewMessageCard}>Карточка 2</span>
              </div>
              <div className={styles.previewMessageColumn}>
                <span className={styles.previewMessageCard}>Карточка 3</span>
                <span className={styles.previewMessageCard}>Карточка 4</span>
              </div>
            </>
          )}
        </div>

        <p className={styles.previewSchemeHint}>
          Это быстрый макет без реальных данных. Он нужен, чтобы сразу видеть, как меняется структура экрана.
        </p>
      </div>

      <div className={styles.blockList}>
        {options.map((option) => (
          <label
            key={option.id}
            className={`${styles.blockCard} ${option.disabled ? styles.blockCardDisabled : ""}`}
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
            <span className={styles.blockTitle}>{option.label}</span>
            <span className={styles.blockDescription}>{option.description}</span>
          </label>
        ))}
      </div>

      <div className={styles.settingGroup}>
        <span className={styles.blockTitle}>Как показывать поздравления</span>
        <div className={styles.layoutOptionList}>
          {layoutOptions.map((option) => (
            <label key={option.id} className={styles.layoutOptionCard}>
              <input
                type="radio"
                name="layoutMode"
                value={option.id}
                defaultChecked={option.id === initialLayoutMode}
                onChange={() => setLayoutMode(option.id)}
              />
              <span className={styles.blockTitle}>{option.label}</span>
              <span className={styles.blockDescription}>{option.description}</span>
            </label>
          ))}
        </div>
      </div>

      <label className={styles.blockCard}>
        <input
          type="checkbox"
          name="showAllLink"
          defaultChecked={initialShowAllLink}
          onChange={(event) => setShowAllLink(event.target.checked)}
        />
        <span className={styles.blockTitle}>Кнопка &quot;Смотреть все поздравления&quot;</span>
        <span className={styles.blockDescription}>
          Открывает отдельный экран, где удобно читать все поздравления подряд.
        </span>
      </label>

      <p className={styles.line}>
        Отдельный экран со всеми поздравлениями: <strong>{showAllLink ? "включен" : "выключен"}</strong>
      </p>

      <div className={styles.editorFooter}>
        <button type="submit" className={styles.button} disabled={isPending}>
          {isPending ? "Сохраняем..." : "Сохранить настройки"}
        </button>
        {state.message ? (
          <span className={state.ok ? styles.editorSuccess : styles.editorError}>{state.message}</span>
        ) : null}
      </div>
    </form>
  );
};
