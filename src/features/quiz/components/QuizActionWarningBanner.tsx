import React from "react";

interface QuizActionWarningBannerProps {
  message: string;
}

const QuizActionWarningBanner: React.FC<QuizActionWarningBannerProps> = ({ message }) => (
  <div
    className="quiz-action-warning-banner"
    role="status"
    aria-live="polite"
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
      style={{ flexShrink: 0, marginTop: "0.1rem" }}
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
    <span>{message}</span>
  </div>
);

export default QuizActionWarningBanner;
