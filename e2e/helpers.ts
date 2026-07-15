import { expect, type Page } from "@playwright/test";

export const EMAIL = process.env.E2E_EMAIL ?? "mentor1@example.com";
export const PASSWORD = process.env.E2E_PASSWORD ?? "mentor@123";

export async function login(page: Page): Promise<void> {
  await page.goto("/auth");
  await page.locator("#login-email").fill(EMAIL);
  await page.locator("#login-password").fill(PASSWORD);
  await page.locator("#login-submit").click();
  await page.waitForURL("**/mentor/spaces**", { timeout: 60_000 });
}

async function waitForSpaceReady(page: Page): Promise<void> {
  const loading = page.getByText("Loading space…");
  if (await loading.isVisible().catch(() => false)) {
    await loading.waitFor({ state: "hidden", timeout: 120_000 });
  }
  await page.waitForTimeout(1_000);
}

async function tryOpenSpaceAtIndex(page: Page, index: number): Promise<boolean> {
  await page.goto("/mentor/spaces");
  await page.waitForTimeout(500);
  const openButtons = page.getByRole("button", { name: /^Open$/i });
  if (index >= (await openButtons.count())) return false;

  await openButtons.nth(index).click();
  await page.waitForURL(/\/mentor\/spaces\/[^/]+/, { timeout: 60_000 });
  await waitForSpaceReady(page);

  const nodes = page.locator(".tree-node__title");
  return nodes.first().isVisible({ timeout: 120_000 }).catch(() => false);
}

export async function openSpaceWithTopics(page: Page): Promise<void> {
  // Index order from deployed mentor1 account: 0=HTML (empty), 1=Organic, 2=React
  const preferredIndices = [2, 1, 0];

  for (const index of preferredIndices) {
    if (await tryOpenSpaceAtIndex(page, index)) {
      return;
    }
  }

  throw new Error("No mentor space with topic outline found for E2E tests.");
}

/** @deprecated Use openSpaceWithTopics — first card may be an empty space. */
export async function openSpaceByIndex(page: Page, index = 0): Promise<void> {
  await openSpaceWithTopics(page);
}

export async function selectNodeForGeneration(page: Page): Promise<void> {
  const nodes = page.locator(".tree-node__select");
  const fallbackNodes = page.locator(".tree-node__title");
  const nodeLocator = (await nodes.count()) > 0 ? nodes : fallbackNodes;
  await expect(nodeLocator.first()).toBeVisible({ timeout: 30_000 });
  const count = await nodeLocator.count();

  for (let i = 0; i < count; i += 1) {
    await nodeLocator.nth(i).click({ force: true });
    await page.waitForTimeout(800);
    await goToGenerateTab(page);

    const generateDraft = page.getByRole("button", { name: /^Generate draft$/i });
    const newDraft = page.getByRole("button", { name: /Generate a new draft/i });
    const draftReady = await newDraft.isVisible().catch(() => false);
    const freshDraft = await generateDraft.isVisible().catch(() => false);
    const canUseNewDraft = draftReady && await newDraft.isEnabled().catch(() => false);
    const canUseFreshDraft = freshDraft && await generateDraft.isEnabled().catch(() => false);

    if (canUseFreshDraft || canUseNewDraft) {
      await goToGenerateTab(page);
      return;
    }
  }

  throw new Error("No topic found with an enabled generate action.");
}

export async function selectTreeNode(page: Page, index = 0): Promise<void> {
  const nodes = page.locator(".tree-node__title");
  await expect(nodes.first()).toBeVisible({ timeout: 30_000 });
  const count = await nodes.count();
  const target = Math.min(index, count - 1);
  await nodes.nth(target).click();
  await page.waitForTimeout(800);

  const selectPrompt = page.getByText(/Select a topic from your outline/i);
  if (await selectPrompt.isVisible().catch(() => false)) {
    await nodes.nth(target).click();
    await page.waitForTimeout(800);
  }
}

export async function goToGenerateTab(page: Page): Promise<void> {
  const generateTab = page.getByRole("tab", { name: /^Generate tab$/i });
  if (await generateTab.isVisible().catch(() => false)) {
    await generateTab.click({ force: true });
  }
}

export async function goToMaterialTab(page: Page): Promise<void> {
  const materialTab = page.getByRole("tab", { name: /^Material tab$/i });
  if (await materialTab.isVisible().catch(() => false)) {
    await materialTab.click({ force: true });
    await page.waitForTimeout(500);
  }
}

export async function clickGenerateDraft(page: Page): Promise<void> {
  await goToGenerateTab(page);

  const newDraft = page.getByRole("button", { name: /Generate a new draft/i });
  if (await newDraft.isVisible({ timeout: 10_000 }).catch(() => false)) {
    await expect(newDraft).toBeEnabled({ timeout: 10_000 });
    await newDraft.scrollIntoViewIfNeeded();
    await newDraft.click({ force: true });
    const confirm = page.getByRole("button", { name: /Yes, regenerate/i });
    if (await confirm.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await confirm.click();
    }
    return;
  }

  const generateDraft = page.getByRole("button", { name: /^Generate draft$/i });
  await expect(generateDraft).toBeEnabled({ timeout: 10_000 });
  const warningContinue = page.getByRole("button", { name: /Continue anyway/i });
  await generateDraft.scrollIntoViewIfNeeded();
  await generateDraft.click({ force: true });
  if (await warningContinue.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await warningContinue.click();
  }
}

export async function waitForGenerationRunning(page: Page): Promise<void> {
  await expect(page.getByRole("tab", { name: /^Material tab$/i })).toBeEnabled({
    timeout: 120_000,
  });
  await goToMaterialTab(page);
  const panel = page.locator(".generation-progress");
  await expect(panel.getByRole("button", { name: /^Cancel$/i })).toBeVisible({
    timeout: 120_000,
  });
  await expect(panel.locator(".generation-progress__steps li").nth(0)).toBeVisible({
    timeout: 120_000,
  });
  // Scenario 1: cancel during step 2 — wait until a second step appears or first completes.
  await expect
    .poll(async () => {
      const steps = panel.locator(".generation-progress__steps li");
      const count = await steps.count();
      if (count >= 2) return true;
      const firstComplete = await panel
        .locator(".generation-progress__step--complete")
        .count();
      return firstComplete > 0;
    }, { timeout: 180_000 })
    .toBe(true);
}

export async function clickCancelGeneration(page: Page): Promise<void> {
  const panel = page.locator(".generation-progress");
  const cancelBtn = panel.getByRole("button", { name: /^Cancel$/i });
  await expect(cancelBtn).toBeVisible({ timeout: 10_000 });
  await cancelBtn.click();
}

export async function waitForPausedPanel(page: Page): Promise<void> {
  await goToMaterialTab(page);
  const panel = page.locator(".generation-progress");
  await expect(panel.getByRole("button", { name: /^Continue$/i })).toBeVisible({
    timeout: 180_000,
  });
  await expect(panel.getByRole("button", { name: /^Delete run$/i })).toBeVisible({
    timeout: 30_000,
  });
  await expect(panel).toHaveClass(/generation-progress--paused/);
}

export async function clickDeleteRun(page: Page): Promise<void> {
  const panel = page.locator(".generation-progress");
  await panel.getByRole("button", { name: /^Delete run$/i }).click();
  await expect(panel).toBeHidden({ timeout: 60_000 });
}

export async function clickContinueGeneration(page: Page): Promise<void> {
  await page.locator(".generation-progress").getByRole("button", { name: /^Continue$/i }).click();
}

export async function waitForGenerationComplete(page: Page): Promise<void> {
  await expect(page.getByRole("button", { name: /^Cancel$/i })).toBeHidden({
    timeout: 300_000,
  });
  await expect(page.getByText(/Generation paused/i)).toBeHidden({ timeout: 300_000 });
}

export async function expectNotStuckOnStarting(page: Page): Promise<void> {
  await page.waitForTimeout(5_000);
  const starting = page.getByText(/^Starting…$/i);
  await expect(starting).toBeHidden({ timeout: 30_000 });
}

export async function openReferenceModal(page: Page): Promise<void> {
  await goToGenerateTab(page);
  const refButton = page.locator(".gsm-setup-hero-extra").filter({ hasText: /Reference PDF/i });
  await refButton.first().click();
  await expect(page.getByText(/Source document/i).first()).toBeVisible({ timeout: 15_000 });
}

export async function removeReferenceIfPresent(page: Page): Promise<void> {
  await openReferenceModal(page);
  const deleteBtn = page.getByRole("button", { name: /Remove|Delete/i });
  if (await deleteBtn.isVisible().catch(() => false)) {
    await deleteBtn.click();
    await page.waitForTimeout(1_500);
  }
  const closeBtn = page.getByRole("button", { name: /Close/i });
  if (await closeBtn.isVisible().catch(() => false)) {
    await closeBtn.click();
  }
}
