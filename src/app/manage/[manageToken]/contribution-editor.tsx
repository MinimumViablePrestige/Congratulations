"use client";

import { useActionState, useState } from "react";
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
  const [message, setMessage] = useState(initialMessage);

  return (
    <form action={formAction} className={styles.editorForm}>
      <input type="hidden" name="manageToken" value={manageToken} />
      <input type="hidden" name="contributionId" value={contributionId} />

      <div className={styles.editorHeader}>
        <label className={styles.editorLabel} htmlFor={`message-${contributionId}`}>
          Текст поздравления
        </label>
        <span className={styles.editorCounter}>
          {message.length} / {messageLimit}
        </span>
      </div>

      <p className={styles.editorHint}>
        Для текущего формата лучше держать текст в пределах {messageLimit} символов.
      </p>

      <textarea
        id={`message-${contributionId}`}
        name="message"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
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
