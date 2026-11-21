// Copie l'appli publique dans "www" pour l'APK. admin/ n'est JAMAIS copié.
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const out = path.join(root, "www");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const keep = ["index.html", "sw.js", "manifest.webmanifest", "manifest.json", "assets"];
for (const n of keep) {
  const s = path.join(root, n);
  if (fs.existsSync(s)) fs.cpSync(s, path.join(out, n), { recursive: true });
}
if (!fs.existsSync(path.join(out, "index.html"))) { console.error("index.html introuvable"); process.exit(1); }
if (fs.existsSync(path.join(out, "admin"))) { console.error("admin dans www : stop"); process.exit(1); }
console.log("www prêt :", fs.readdirSync(out).join(", "));
