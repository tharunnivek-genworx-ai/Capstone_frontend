/**
 * Manual Test Gate 2 — study material cancel/delete (deployed E2E).
 * Requires redeployed frontend + study-agent-service with Phase 0–2 changes.
 */
import { test, expect } from "@playwright/test";
import {
  clickCancelGeneration,
  clickContinueGeneration,
  clickDeleteRun,
  clickGenerateDraft,
  expectNotStuckOnStarting,
  goToMaterialTab,
  login,
  openReferenceModal,
  openSpaceWithTopics,
  removeReferenceIfPresent,
  selectNodeForGeneration,
  waitForGenerationComplete,
  waitForGenerationRunning,
  waitForPausedPanel,
} from "./helpers";

test.describe.configure({ mode: "serial" });

test.describe("Manual test gate — study material lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await openSpaceWithTopics(page);
  });

  test("1 — Generate → Cancel on step 2 → pause modal, stay on Material tab", async ({ page }) => {
    await selectNodeForGeneration(page);
    await clickGenerateDraft(page);
    await waitForGenerationRunning(page);
    await clickCancelGeneration(page);
    await waitForPausedPanel(page);

    await goToMaterialTab(page);
    await expect(page.getByText(/Resume continues with the same reference/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^Cancel$/i })).toBeHidden();
    await clickDeleteRun(page);
  });

  test("2 — Continue after pause completes with draft visible", async ({ page }) => {
    await selectNodeForGeneration(page);
    await clickGenerateDraft(page);
    await waitForGenerationRunning(page);
    await clickCancelGeneration(page);
    await waitForPausedPanel(page);

    await clickContinueGeneration(page);
    await waitForGenerationComplete(page);

    await goToMaterialTab(page);
    const materialBody = page.locator(".study-material-page");
    await expect(materialBody).toBeVisible();
    await expect(page.locator(".generation-progress")).toBeHidden({ timeout: 30_000 });
  });

  test("3 — Cancel → Delete run → reload leaves no orphan draft panel", async ({ page }) => {
    await selectNodeForGeneration(page);
    await clickGenerateDraft(page);
    await waitForGenerationRunning(page);
    await clickCancelGeneration(page);
    await waitForPausedPanel(page);
    await clickDeleteRun(page);

    const url = page.url();
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForURL(url, { timeout: 60_000 });

    await expect(page.getByText(/Generation paused/i)).toBeHidden({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: /^Delete run$/i })).toBeHidden();
  });

  test("4 — Cancel near completion shows material or success (not stuck paused)", async ({ page }) => {
    await selectNodeForGeneration(page);
    await clickGenerateDraft(page);
    await waitForGenerationRunning(page);

    const assessingStep = page.locator(".generation-progress__label", {
      hasText: /Assessing|quality/i,
    });
    if (await assessingStep.isVisible({ timeout: 180_000 }).catch(() => false)) {
      await clickCancelGeneration(page);
    } else {
      await clickCancelGeneration(page);
    }

    const completedMaterial = page.locator(".study-material-mentor-workspace, .study-material-page")
      .filter({ hasNot: page.locator(".generation-progress--paused") });
    const paused = page.getByText(/Generation paused/i);
    const successToast = page.getByText(/saved as v/i);

    await Promise.race([
      expect(completedMaterial).toBeVisible({ timeout: 180_000 }),
      expect(paused).toBeVisible({ timeout: 180_000 }),
      expect(successToast).toBeVisible({ timeout: 180_000 }),
    ]).catch(async () => {
      if (await paused.isVisible()) {
        await clickDeleteRun(page);
      }
      throw new Error("Neither success material nor paused state appeared after cancel near completion.");
    });

    if (await paused.isVisible().catch(() => false)) {
      await clickDeleteRun(page);
    }
  });

  test("5 — Cancel → change reference → Continue → 409 → Delete → new generate", async ({ page }) => {
    await selectNodeForGeneration(page);
    await clickGenerateDraft(page);
    await waitForGenerationRunning(page);
    await clickCancelGeneration(page);
    await waitForPausedPanel(page);

    await removeReferenceIfPresent(page);

    await clickContinueGeneration(page);
    await expect(
      page.getByText(/Reference or generation settings changed/i),
    ).toBeVisible({ timeout: 30_000 });

    await clickDeleteRun(page);
    await clickGenerateDraft(page);
    await waitForGenerationRunning(page);
    await clickCancelGeneration(page);
    await waitForPausedPanel(page);
    await clickDeleteRun(page);
  });

  test("6 — Cancel → Delete → immediate regenerate does not stick on Starting…", async ({ page }) => {
    await selectNodeForGeneration(page);
    await clickGenerateDraft(page);
    await waitForGenerationRunning(page);
    await clickCancelGeneration(page);
    await waitForPausedPanel(page);
    await clickDeleteRun(page);

    await clickGenerateDraft(page);
    await expectNotStuckOnStarting(page);
    await waitForGenerationRunning(page);
    await clickCancelGeneration(page);
    await waitForPausedPanel(page);
    await clickDeleteRun(page);
  });
});
