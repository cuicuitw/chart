// 翠誌文章頁的分享預覽（Open Graph）。
// 文章頁由前端 JavaScript 產生，LINE / Facebook 的爬蟲不會執行 JavaScript，
// 所以這支函式在伺服器端讀出文章，把標題、摘要、封面寫進 HTML 再回傳。
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

admin.initializeApp();
const db = admin.firestore();

// deploy 前由 workflow 把網站的 index.html 複製到 functions/ 底下
const TEMPLATE = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const SITE = "https://cuicui.tw";
const DEFAULT_IMAGE = SITE + "/icon-512.png";
const SITE_NAME = "翠脆的心";

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function plain(s) {
  return String(s ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clip(s, n) {
  const t = plain(s);
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
}

// 與前端 postKey 相同：有 slug 用 slug，否則用文件 id
async function findPublishedPost(key) {
  const bySlug = await db
    .collection("posts")
    .where("slug", "==", key)
    .where("status", "==", "published")
    .limit(1)
    .get();
  if (!bySlug.empty) return bySlug.docs[0].data();

  const byId = await db.collection("posts").doc(key).get();
  if (byId.exists && byId.data().status === "published") return byId.data();
  return null;
}

function injectPost(html, post, key) {
  const title = `${post.seoTitle || post.title || SITE_NAME}｜${SITE_NAME}`;
  const desc = clip(post.seoDesc || post.summary || post.body || "", 120) ||
    "翠脆的心占星官網文章";
  const image =
    /^https:\/\/firebasestorage\.googleapis\.com\//.test(post.cover || "")
      ? post.cover
      : DEFAULT_IMAGE;
  const url = `${SITE}/blog/${encodeURIComponent(key)}`;

  const og = [
    `<link rel="canonical" href="${esc(url)}">`,
    `<meta property="og:type" content="article">`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:image" content="${esc(image)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(desc)}">`,
    `<meta name="twitter:image" content="${esc(image)}">`,
  ].join("\n");

  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(
      /<meta name="description" content="[^"]*">/,
      `<meta name="description" content="${esc(desc)}">`
    )
    .replace("</head>", og + "\n</head>");
}

exports.blog = onRequest(
  { region: "asia-east1", memory: "256MiB", maxInstances: 10 },
  async (req, res) => {
    let html = TEMPLATE;
    const m = req.path.match(/^\/blog\/([^/]+)\/?$/);
    if (m) {
      try {
        const key = decodeURIComponent(m[1]);
        const post = await findPublishedPost(key);
        if (post) html = injectPost(TEMPLATE, post, key);
      } catch (e) {
        console.error("blog og failed", e);
      }
    }
    res.set("Content-Type", "text/html; charset=utf-8");
    res.set("Cache-Control", "public, max-age=300, s-maxage=300");
    res.status(200).send(html);
  }
);
