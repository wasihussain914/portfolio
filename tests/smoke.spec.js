import { test, expect } from "@playwright/test";

// End-to-end smoke tests. These drive the real page in a real browser and
// assert that every data-driven section renders and the 3D layer boots without
// throwing. They intentionally cover the failure modes we care about:
//   - content actually populates from data.js (not empty shells)
//   - no uncaught console errors / page errors
//   - the WebGL hero + skills canvases exist
//   - the project filter genuinely hides/shows cards
//   - key personal links point where they should

test.describe("portfolio", () => {
  test("loads with no console or page errors", async ({ page }) => {
    const errors = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Ignore benign network noise (e.g. font CDN blips); fail on real JS errors.
    const real = errors.filter((e) => !/favicon|net::ERR|Failed to load resource/i.test(e));
    expect(real, `unexpected errors:\n${real.join("\n")}`).toEqual([]);
  });

  test("hero renders name, rotating role, and stats", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#hero-name")).toHaveText("Wasi Hussain");
    await expect(page.locator("#hero-blurb")).not.toBeEmpty();
    const stats = page.locator("#hero-stats .stat");
    await expect(stats).toHaveCount(4);
    // Counter animates to a non-zero value.
    await page.waitForTimeout(2000);
    await expect(page.locator("#hero-stats .stat-value").first()).not.toHaveText(/^\$0/);
  });

  test("all experience entries render", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#timeline .tl-item")).toHaveCount(5);
    await expect(page.locator("#timeline")).toContainText("Vanderbilt ISIS");
    await expect(page.locator("#timeline")).toContainText("DARPA CASTLE");
  });

  test("projects render and the filter works", async ({ page }) => {
    await page.goto("/");
    const cards = page.locator(".p-card");
    const total = await cards.count();
    expect(total).toBeGreaterThanOrEqual(15);

    // Award filter shows fewer than all, but at least the four award winners.
    await page.getByRole("button", { name: /Award-Winning/i }).click();
    const visible = page.locator(".p-card:not(.hide)");
    const awardCount = await visible.count();
    expect(awardCount).toBeGreaterThanOrEqual(4);
    expect(awardCount).toBeLessThan(total);
    await expect(page.locator(".p-card:not(.hide)").first()).toContainText(/AnchorExchange|Hush-Mesh|Aegis-Edge|Narravision/);

    // Reset restores everything.
    await page.getByRole("button", { name: /^All\b/ }).click();
    await expect(page.locator(".p-card:not(.hide)")).toHaveCount(total);
  });

  test("clicking a project opens a detail modal, escape closes it", async ({ page }) => {
    await page.goto("/");
    await page.locator(".p-card").first().click();
    const modal = page.locator(".modal.open");
    await expect(modal).toBeVisible();
    await expect(modal.locator(".modal-name")).not.toBeEmpty();
    await expect(modal).toContainText(/Impact/i);
    await expect(modal).toContainText(/Built with/i);
    // Open-project link points at a real URL.
    await expect(modal.locator("a.btn-primary")).toHaveAttribute("href", /https?:\/\//);
    await page.keyboard.press("Escape");
    await expect(page.locator(".modal.open")).toHaveCount(0);
  });

  test("command palette opens with Ctrl+K, filters, and navigates", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    await expect(page.locator(".cmdk.open")).toBeVisible();
    const items = page.locator(".cmdk-item");
    expect(await items.count()).toBeGreaterThan(10);
    await page.locator(".cmdk-input").fill("hush");
    await expect(page.locator(".cmdk-item")).toHaveCount(1);
    await expect(page.locator(".cmdk-item").first()).toContainText(/Hush-Mesh/i);
    // Enter on a project opens its modal.
    await page.keyboard.press("Enter");
    await expect(page.locator(".modal.open")).toBeVisible();
    await expect(page.locator(".modal-name")).toContainText("Hush-Mesh");
  });

  test("awards ribbon lists every award-winning project", async ({ page }) => {
    await page.goto("/");
    const chips = page.locator(".award-chip");
    // ribbon is duplicated for a seamless loop, so count is even and > 0
    expect(await chips.count()).toBeGreaterThanOrEqual(8);
    await expect(page.locator(".awards-track")).toContainText("AnchorExchange");
  });

  test("accent switcher recolours the theme and persists", async ({ page }) => {
    await page.goto("/");
    const swatches = page.locator(".swatch");
    await expect(swatches).toHaveCount(5);
    await page.locator('.swatch[data-key="rose"]').click();
    const accent = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--accent").trim());
    expect(accent.toLowerCase()).toBe("#f472b6");
    const saved = await page.evaluate(() => localStorage.getItem("pf-theme"));
    expect(saved).toBe("rose");
    // survives reload
    await page.reload();
    await expect(page.locator('.swatch[data-key="rose"]')).toHaveClass(/on/);
  });

  test("SEO: structured data and social meta are present", async ({ page }) => {
    await page.goto("/");
    const ld = await page.locator('script[type="application/ld+json"]').textContent();
    const data = JSON.parse(ld);
    expect(data["@type"]).toBe("Person");
    expect(data.name).toMatch(/Hussain/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /Wasi Hussain/);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  });

  test("3D canvases are present and sized", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const bg = page.locator("#bg-canvas");
    await expect(bg).toBeVisible();
    const box = await bg.boundingBox();
    expect(box.width).toBeGreaterThan(100);
    await expect(page.locator("#skills-canvas")).toBeAttached();
  });

  test("skills groups render", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".skill-group")).toHaveCount(5);
    await expect(page.locator("#skills-bars")).toContainText("PyTorch");
  });

  test("personal links point to Wasi's real profiles", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#link-github")).toHaveAttribute("href", "https://github.com/wasihussain914");
    await expect(page.locator("#link-linkedin")).toHaveAttribute("href", "https://www.linkedin.com/in/wasihussain914");
    await expect(page.locator("#contact-email")).toHaveText("wasi.hussain914@gmail.com");
  });

  test("resume pdf is reachable", async ({ page }) => {
    const res = await page.request.get("/assets/resume.pdf");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("pdf");
  });
});
