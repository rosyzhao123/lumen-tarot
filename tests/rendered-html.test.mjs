import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the spread selection home", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Lumen Tarot/);
  assert.match(html, /选择一座牌阵/);
  assert.match(html, /THE FOUR SPREADS/);
  assert.match(html, /HISTORY/);
  assert.match(html, /进入牌阵/);
  assert.match(html, /维纳斯爱情牌阵/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("server-renders each selected spread with its matching card fan", async () => {
  const cases = [
    ["daily", "今日一牌", 1],
    ["timeline", "三张时间流", 3],
    ["choice", "二选一牌阵", 5],
    ["venus", "维纳斯爱情牌阵", 7],
  ];

  for (const [spread, title, count] of cases) {
    const response = await render(`/reading?spread=${spread}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, new RegExp(title));
    assert.equal(html.match(/class="fan-card"/g)?.length, count);
    assert.match(html, /进入抽牌仪式/);
    assert.doesNotMatch(html, /包含逆位|spread-switcher|data-testid="spread-/);
    assert.match(html, /78 CARDS/);
    assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
  }
});
