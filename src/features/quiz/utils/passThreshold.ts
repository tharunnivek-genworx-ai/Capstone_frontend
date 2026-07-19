export const DEFAULT_PASS_THRESHOLD_PERCENT = 70;

export function isValidPassThreshold(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 100;
}
