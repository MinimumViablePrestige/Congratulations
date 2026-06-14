"use client";

import { useActionState } from "react";
import { updateContributionMessageAction } from "./actions";
import styles from "./manage-page.module.css";

type Props = {
  contributionId: string;
  manageToken: string;
  initialMessage: string;
  messageLimit: number;
};

const initialState = {
  ok: false,
  message: ""
};

export const ContributionEditor = ({ contributionId, manageToken, initialMessage, messageLimit }: Props) => {
  const [state, formAction, isPending] = useActionState(updateContributionMessageAction, initialState);

  return (
    <form action={formAction} className={styles.editorForm}>
      <input type="hidden" name="manageToken" value={manageToken} />
      <input type="hidden" name="contributionId" value={contributionId} />
      <label className={styles.editorLabel} htmlFor={`message-${contributionId}`}>
        Текст поздравления
      </label>
      <p className={styles.editorHint}>Для текущего формата лучше держать текст в пределах {messageLimit} символов.</p>
      <textarea
        id={`message-${contributionId}`}
        name="message"
        defaultValue={initialMessage}
        className={styles.editorTextarea}
        maxLength={1500}
      />
      <div className={styles.editorFooter}>
        <button type="submit" className={styles.button} disabled={isPending}>
          {isPending ? "Сохраняем..." : "Сохранить текст"}
        </button>
        {state.message ? (
          <span className={state.ok ? styles.editorSuccess : styles.editorError}>{state.message}</span>
        ) : null}
      </div>
    </form>
  );
};
