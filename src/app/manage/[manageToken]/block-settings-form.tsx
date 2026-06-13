"use client";

import { useActionState } from "react";
import type { FinalCardOptionalBlockId } from "@/lib/final-card/types";
import { updateFinalBlockSettingsAction } from "./actions";
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
};

const initialState = {
  ok: false,
  message: ""
};

export const BlockSettingsForm = ({ manageToken, options }: Props) => {
  const [state, formAction, isPending] = useActionState(updateFinalBlockSettingsAction, initialState);

  return (
    <form action={formAction} className={styles.blockForm}>
      <input type="hidden" name="manageToken" value={manageToken} />

      <div className={styles.blockList}>
        {options.map((option) => (
          <label
            key={option.id}
            className={`${styles.blockCard} ${option.disabled ? styles.blockCardDisabled : ""}`}
          >
            <input type="checkbox" name={option.id} defaultChecked={option.checked} disabled={option.disabled} />
            <span className={styles.blockTitle}>{option.label}</span>
            <span className={styles.blockDescription}>{option.description}</span>
          </label>
        ))}
      </div>

      <div className={styles.editorFooter}>
        <button type="submit" className={styles.button} disabled={isPending}>
          {isPending ? "Сохраняем..." : "Сохранить состав"}
        </button>
        {state.message ? (
          <span className={state.ok ? styles.editorSuccess : styles.editorError}>{state.message}</span>
        ) : null}
      </div>
    </form>
  );
};
