import { expect, test } from "@playwright/test";

import { login, openSpaceWithTopics } from "./helpers";

test.describe("learning experience regression", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await openSpaceWithTopics(page);
  });

  test("global navigation collapse does not hide the topic outline", async ({ page }) => {
    const sidebar = page.locator(".learning-spaces-sidebar");
    const shellContent = page.locator(".learning-space-route-layout__content");
    const topicPanel = page.locator(".space-topic-panel");
    await expect(topicPanel).toBeVisible();

    const expandedSidebarBox = await sidebar.boundingBox();
    const expandedContentBox = await shellContent.boundingBox();
    const expandedTopicBox = await topicPanel.boundingBox();
    expect(expandedSidebarBox).not.toBeNull();
    expect(expandedContentBox).not.toBeNull();
    expect(expandedTopicBox).not.toBeNull();
    expect(expandedContentBox!.x).toBeGreaterThanOrEqual(expandedSidebarBox!.x + expandedSidebarBox!.width - 1);
    expect(expandedTopicBox!.x).toBeGreaterThanOrEqual(expandedSidebarBox!.x + expandedSidebarBox!.width - 1);

    await page.getByRole("button", { name: /Collapse learning spaces sidebar/i }).click();

    await expect(page.locator(".learning-space-route-layout")).toHaveClass(/sidebar-collapsed/);
    await expect(page.getByRole("button", { name: "Hide topic outline" })).toBeVisible();
    await expect(topicPanel).toBeVisible();
    await expect(topicPanel).not.toHaveClass(/space-topic-panel--hidden/);
    await expect(topicPanel.getByRole("button", { name: "Hide topic outline" })).toHaveCount(0);

    await expect
      .poll(async () => (await shellContent.boundingBox())?.x)
      .toBeLessThan(expandedContentBox!.x);
    const collapsedContentBox = await shellContent.boundingBox();
    expect(collapsedContentBox).not.toBeNull();
    expect(collapsedContentBox!.width).toBeGreaterThan(expandedContentBox!.width);
  });

  test("topic actions are keyboard operated and return focus on Escape", async ({ page }) => {
    const trigger = page.locator(".tree-node__menu-trigger").first();
    await trigger.focus();
    await page.keyboard.press("Enter");

    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await expect(page.getByRole("menuitem").first()).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menuitem").nth(1)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("mentor workspace uses the compact header and four content modes", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Show overall space progress" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Share" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Manage Learners" })).toBeVisible();
    await expect(page.locator("header code")).toHaveCount(0);

    const topicPanel = page.locator(".space-topic-panel");
    await expect(page.getByRole("button", { name: "Hide topic outline" })).toBeVisible();
    await expect(topicPanel.getByRole("button", { name: /Generate all study materials/ })).toBeVisible();
    await expect(topicPanel.getByRole("button", { name: "Create New Section" })).toBeVisible();

    // Content mode tabs only mount after a topic is selected (empty canvas otherwise).
    await page.getByRole("treeitem").first().click();
    await expect(page.getByRole("tab", { name: "Generate tab" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Material tab" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Quiz tab" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Hints tab" })).toBeVisible();
    await expect(page.getByLabel("Lesson workflow")).toHaveCount(0);
  });

  test("narrow viewport keeps shell controls reachable without page overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await expect(page.getByRole("button", { name: /topic outline/i })).toBeVisible();
    const hasHorizontalPageOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalPageOverflow).toBe(false);
  });

  test("mentor role cannot enter IT-admin routes", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).not.toHaveURL(/\/dashboard$/);
    await expect(page.locator(".learning-experience")).toBeVisible();
  });
});

test("IT-admin shell remains outside learning-experience styling", async ({ page }) => {
  test.skip(
    !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
    "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD for the admin regression check.",
  );

  await page.goto("/auth");
  await page.locator("#login-email").fill(process.env.E2E_ADMIN_EMAIL!);
  await page.locator("#login-password").fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.locator("#login-submit").click();
  await page.waitForURL("**/dashboard", { timeout: 60_000 });

  await expect(page.locator(".learning-experience")).toHaveCount(0);
  await expect(page.locator("aside")).toBeVisible();
  const isolation = await page.evaluate(() => {
    const baseline = document.createElement("button");
    const learningClassProbe = document.createElement("button");
    learningClassProbe.className = "tree-node__menu-trigger sm-mentor-btn";
    baseline.textContent = "baseline";
    learningClassProbe.textContent = "probe";
    document.body.append(baseline, learningClassProbe);
    const properties = ["fontFamily", "fontSize", "color", "backgroundColor", "borderRadius"] as const;
    const baselineStyle = getComputedStyle(baseline);
    const probeStyle = getComputedStyle(learningClassProbe);
    const result = {
      learningPrimary: probeStyle.getPropertyValue("--as-primary"),
      differences: properties.filter((property) => baselineStyle[property] !== probeStyle[property]),
    };
    baseline.remove();
    learningClassProbe.remove();
    return result;
  });
  expect(isolation.learningPrimary).toBe("");
  expect(isolation.differences).toEqual([]);
});
