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

const slotMeta: Array<{
  slot: CardMediaSlot;
  title: string;
  hint: string;
  activeIn: FinalCardMessageMediaLayout[];
}> = [
  {
    slot: "portrait",
    title: "Вертикальное фото",
    hint: "Используется в режиме с одним большим фото справа.",
    activeIn: ["portrait"]
  },
  {
    slot: "landscape-a",
    title: "Горизонтальное фото A",
    hint: "Первое фото для режима с двумя горизонтальными кадрами.",
    activeIn: ["landscape-pair"]
  },
  {
    slot: "landscape-b",
    title: "Горизонтальное фото B",
    hint: "Второе фото для режима с двумя горизонтальными кадрами.",
    activeIn: ["landscape-pair"]
  }
];

const MediaSlotCard = ({
  asset,
  manageToken,
  slot,
  title,
  hint,
  isActive
}: {
  asset: CardMediaAsset | undefined;
  manageToken: string;
  slot: CardMediaSlot;
  title: string;
  hint: string;
  isActive: boolean;
}) => {
  const [saveState, saveAction, savePending] = useActionState(saveCardMediaAction, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteCardMediaAction, initialState);

  return (
    <article className={`${styles.mediaManagerCard} ${isActive ? styles.mediaManagerCardActive : ""}`}>
      <div className={styles.mediaManagerHeader}>
        <div>
          <h3 className={styles.mediaManagerTitle}>{title}</h3>
          <p className={styles.controlHint}>{hint}</p>
        </div>
        <span className={styles.infoBadge}>{isActive ? "сейчас на экране" : "запасной слот"}</span>
      </div>

      <div className={styles.mediaPreview}>
        {asset ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset.publicUrl} alt={asset.caption || title} className={styles.mediaPreviewImage} />
        ) : (
          <div className={styles.mediaPreviewEmpty}>Фото пока не загружено</div>
        )}
      </div>

      <form action={saveAction} className={styles.mediaForm}>
        <input type="hidden" name="manageToken" value={manageToken} />
        <input type="hidden" name="slot" value={slot} />
        <input type="hidden" name="assetId" value={asset?.id ?? ""} />

        <label className={styles.editorLabel} htmlFor={`caption-${slot}`}>
          Подпись
        </label>
        <input
          id={`caption-${slot}`}
          name="caption"
          defaultValue={asset?.caption ?? ""}
          className={styles.mediaInput}
          placeholder="Короткая подпись к фото"
          maxLength={160}
        />

        <label className={styles.editorLabel} htmlFor={`file-${slot}`}>
          Файл
        </label>
        <input
          id={`file-${slot}`}
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className={styles.mediaFileInput}
        />

        <div className={styles.editorFooter}>
          <button type="submit" className={styles.button} disabled={savePending}>
            {savePending ? "Сохраняем..." : asset ? "Обновить слот" : "Загрузить фото"}
          </button>
          {saveState.message ? (
            <span className={saveState.ok ? styles.editorSuccess : styles.editorError}>{saveState.message}</span>
          ) : null}
        </div>
      </form>

      {asset ? (
        <form action={deleteAction} className={styles.mediaDeleteForm}>
          <input type="hidden" name="manageToken" value={manageToken} />
          <input type="hidden" name="assetId" value={asset.id} />
          <button type="submit" className={styles.dangerButton} disabled={deletePending}>
            {deletePending ? "Удаляем..." : "Удалить фото"}
          </button>
          {deleteState.message ? (
            <span className={deleteState.ok ? styles.editorSuccess : styles.editorError}>{deleteState.message}</span>
          ) : null}
        </form>
      ) : null}
    </article>
  );
};

export const MediaManager = ({ manageToken, mediaAssets, mediaLayout }: Props) => (
  <section className={styles.actionsCard}>
    <div className={styles.panelHeader}>
      <div>
        <h2 className={styles.sectionTitle}>Фото для открытки</h2>
        <p className={styles.hint}>
          Первая рабочая версия медиа-блока: загружаем реальные фото и сразу используем их на финальном экране.
        </p>
      </div>
      <span className={styles.infoBadge}>{mediaAssets.length} файлов</span>
    </div>

    <div className={styles.mediaManagerGrid}>
      {slotMeta.map((item) => (
        <MediaSlotCard
          key={item.slot}
          manageToken={manageToken}
          slot={item.slot}
          title={item.title}
          hint={item.hint}
          asset={mediaAssets.find((asset) => asset.slot === item.slot)}
          isActive={item.activeIn.includes(mediaLayout)}
        />
      ))}
    </div>
  </section>
);
