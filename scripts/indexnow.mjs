// Ping IndexNow with every URL in a freshly built sitemap, so Bing (and the
// engines that share its index — ChatGPT retrieves from it) hears about a
// deploy in hours instead of weeks.
//
//   bun scripts/indexnow.mjs <dist-dir> <https://host>
//
// The key lives in scripts/indexnow.key and each site's build writes it to
// dist/<key>.txt, which is how IndexNow verifies the host is ours. A failed
// ping is reported and swallowed — indexing is never worth a failed deploy.
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const [dist, site] = process.argv.slice(2);
if (!dist || !site) {
  console.error("usage: bun scripts/indexnow.mjs <dist-dir> <https://host>");
  process.exit(1);
}

const key = (await readFile(new URL("indexnow.key", import.meta.url), "utf8")).trim();
const sitemap = await readFile(join(dist, "sitemap.xml"), "utf8");
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const host = new URL(site).hostname;

try {
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host,
      key,
      keyLocation: `${site}/${key}.txt`,
      urlList,
    }),
  });
  // 200 = accepted, 202 = accepted-key-pending; anything else is worth reading.
  console.log(`indexnow: ${res.status} for ${urlList.length} URLs on ${host}`);
  if (res.status >= 400) console.log(await res.text());
} catch (err) {
  console.log(`indexnow: ping failed (${err.message ?? err}) — deploy unaffected`);
}
