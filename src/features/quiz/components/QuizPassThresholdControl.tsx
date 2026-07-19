import React, { useEffect, useState } from "react";
import { isValidPassThreshold } from "../utils/passThreshold";

interface QuizPassThresholdControlProps {
  value: number;
  isSaving: boolean;
  onSave: (value: number) => Promise<boolean>;
}

const QuizPassThresholdControl: React.FC<QuizPassThresholdControlProps> = ({
  value,
  isSaving,
  onSave,
}) => {
  const [input, setInput] = useState(String(value));

  useEffect(() => {
    setInput(String(value));
  }, [value]);

  const parsed = Number(input);
  const isValid = isValidPassThreshold(parsed);
  const isDirty = isValid && parsed !== value;

  return (
    <div className="quiz-pass-threshold-control">
      <label htmlFor="quiz-pass-threshold">Pass score</label>
      <div className="quiz-pass-threshold-control__input">
        <input
          id="quiz-pass-threshold"
          type="number"
          min={1}
          max={100}
          step={1}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={isSaving}
          aria-invalid={!isValid}
        />
        <span>%</span>
      </div>
      <button
        type="button"
        className="quiz-secondary-action"
        disabled={!isDirty || isSaving}
        onClick={() => void onSave(parsed)}
      >
        {isSaving ? "Saving…" : "Save"}
      </button>
    </div>
  );
};

export default QuizPassThresholdControl;
