"use client";

import { useActionState } from "react";
import type { CardMediaAsset, CardMediaSlot } from "@/lib/cards/types";
import type { FinalCardMessageMediaLayout } from "@/lib/final-card/types";
import { deleteCardMediaAction, saveCardMediaAction } from "./actions";
import styles from "./manage-page.module.css";

type Props = {
  manageToken: string;
  mediaAssets: CardMediaAsset[];
  mediaLayout: FinalCardMessageMediaLayout;
};

const initialState = {
  ok: false,
  message: ""
};

const messageSlotMap: Record<FinalCardMessageMediaLayout, CardMediaSlot[]> = {
  portrait: ["portrait"],
  "landscape-pair": ["landscape-a", "landscape-b"],
  "landscape-trio": ["landscape-a", "landscape-b", "landscape-c"]
};

const memorySlots: CardMediaSlot[] = ["memory-a", "memory-b", "memory-c"];

const slotLabels: Record<CardMediaSlot, string> = {
  portrait: "1 вертикальное фото",
  "landscape-a": "Горизонтальное фото 1",
  "landscape-b": "Горизонтальное фото 2",
  "landscape-c": "Горизонтальное фото 3",
  "memory-a": "Воспоминание 1",
  "memory-b": "Воспоминание 2",
  "memory-c": "Воспоминание 3"
};

const MediaManagerCard = ({
  manageToken,
  asset,
  slot,
  mediaLayout
}: {
  manageToken: string;
  asset?: CardMediaAsset;
  slot: CardMediaSlot;
  mediaLayout: FinalCardMessageMediaLayout;
}) => {
  const [saveState, saveAction, savePending] = useActionState(saveCardMediaAction, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteCardMediaAction, initialState);
  const isPortrait = mediaLayout === "portrait";

  return (
    <section className={styles.contentPhotoCard}>
      <div className={styles.contentPhotoHeader}>
        <h2 className={styles.contentRailTitle}>{slotLabels[slot]}</h2>
        <p className={styles.contentPhotoHint}>Используются в выбранной раскладке «Колонка + фото».</p>
      </div>

      <div className={styles.contentPhotoModeRow}>
        <span className={`${styles.contentPhotoModePill} ${isPortrait ? styles.contentPhotoModePillActive : ""}`}>
          1 вертикальное фото
        </span>
        <span className={`${styles.contentPhotoModePill} ${!isPortrait ? styles.contentPhotoModePillActive : ""}`}>
          2 горизонтальных
        </span>
      </div>

      <div className={styles.contentPhotoGrid}>
        <div className={styles.contentPhotoPreview}>
          {asset ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={asset.publicUrl}
              alt={asset.captionTitle || asset.captionSubtitle || "Фото для открытки"}
              className={styles.contentPhotoPreviewImage}
            />
          ) : (
            <div className={styles.contentPhotoPlaceholder}>Фото еще не добавлено</div>
          )}
        </div>

        <div className={styles.contentPhotoFormStack}>
          <form action={saveAction} className={styles.contentPhotoForm}>
            <input type="hidden" name="manageToken" value={manageToken} />
            <input type="hidden" name="slot" value={slot} />
            <input type="hidden" name="assetId" value={asset?.id ?? ""} />

            <label className={styles.contentPhotoLabel} htmlFor={`caption-title-${slot}`}>
              Подпись, строка 1
            </label>
            <input
              id={`caption-title-${slot}`}
              name="captionTitle"
              defaultValue={asset?.captionTitle ?? ""}
              className={styles.contentPhotoInput}
              placeholder="Наш выпускной"
              maxLength={60}
            />

            <label className={styles.contentPhotoLabel} htmlFor={`caption-subtitle-${slot}`}>
              Подпись, строка 2
            </label>
            <input
              id={`caption-subtitle-${slot}`}
              name="captionSubtitle"
              defaultValue={asset?.captionSubtitle ?? ""}
              className={styles.contentPhotoInput}
              placeholder="13 июня 2026"
              maxLength={120}
            />

            <input
              id={`file-${slot}`}
              name="file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className={styles.contentPhotoFileInput}
            />

            <div className={styles.contentPhotoActions}>
              <button type="submit" className={styles.contentOutlineButton} disabled={savePending}>
                {savePending ? "Сохраняем..." : asset ? "Заменить" : "Загрузить"}
              </button>
            </div>

            {saveState.message ? (
              <span className={saveState.ok ? styles.contentEditorSuccess : styles.contentEditorError}>{saveState.message}</span>
            ) : null}
          </form>

          {asset ? (
            <form action={deleteAction} className={styles.contentPhotoDeleteForm}>
              <input type="hidden" name="manageToken" value={manageToken} />
              <input type="hidden" name="assetId" value={asset.id} />
              <button type="submit" className={styles.contentDeleteSecondaryButton} disabled={deletePending}>
                {deletePending ? "Удаляем..." : "Удалить"}
              </button>
              {deleteState.message ? (
                <span className={deleteState.ok ? styles.contentEditorSuccess : styles.contentEditorError}>
                  {deleteState.message}
                </span>
              ) : null}
            </form>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export const MediaManager = ({ manageToken, mediaAssets, mediaLayout }: Props) => {
  const messageSlots = messageSlotMap[mediaLayout];

  return (
    <section className={styles.mediaManagerStack}>
      <div className={styles.mediaManagerSectionHeader}>
        <h2 className={styles.contentRailTitle}>Фото для поздравлений</h2>
        <p className={styles.contentPhotoHint}>Используются только в раскладке «Колонка + фото».</p>
      </div>
      {messageSlots.map((slot) => (
        <MediaManagerCard
          key={slot}
          manageToken={manageToken}
          asset={mediaAssets.find((item) => item.slot === slot)}
          slot={slot}
          mediaLayout={mediaLayout}
        />
      ))}

      <div className={styles.mediaManagerSectionHeader}>
        <h2 className={styles.contentRailTitle}>Наши воспоминания</h2>
        <p className={styles.contentPhotoHint}>До трех фото с короткими подписями для отдельного блока открытки.</p>
      </div>
      {memorySlots.map((slot) => (
        <MediaManagerCard
          key={slot}
          manageToken={manageToken}
          asset={mediaAssets.find((item) => item.slot === slot)}
          slot={slot}
          mediaLayout={mediaLayout}
        />
      ))}
    </section>
  );
};
