"use client";

import { Phone } from "lucide-react";
import styles from "./WorkerBottomBar.module.css";

interface WorkerBottomBarProps {
  onReject?: () => void;
  onChoose?: () => void;
  onCall?: () => void;
}

export default function WorkerBottomBar({
  onReject,
  onChoose,
  onCall,
}: WorkerBottomBarProps) {
  return (
    <footer className={styles.bar}>
      {/* Chat input row */}
      <div className={styles.chatRow}>
        <input
          type="text"
          className={styles.chatInput}
          placeholder="Chat with the worker"
          aria-label="Chat with the worker"
        />
        <button
          className={styles.callBtn}
          aria-label="Call worker"
          onClick={onCall}
        >
          <Phone size={18} strokeWidth={2} />
        </button>
      </div>

      {/* Action buttons */}
      <div className={styles.actions}>
        <button className={styles.rejectBtn} onClick={onReject}>
          Reject
        </button>
        <button className={styles.chooseBtn} onClick={onChoose}>
          Choose
        </button>
      </div>
    </footer>
  );
}