// Active la signature "release" et fixe la version dans android/app/build.gradle
const fs = require("fs"), path = require("path");
const f = path.join(__dirname, "..", "android", "app", "build.gradle");
let g = fs.readFileSync(f, "utf8");
const code = process.env.VERSION_CODE || "1", name = process.env.VERSION_NAME || "15.1";
g = g.replace(/versionCode\s+\d+/, "versionCode " + code).replace(/versionName\s+"[^"]*"/, 'versionName "' + name + '"');
if (!/signingConfigs\s*\{/.test(g)) {
  g = g.replace(/(buildTypes\s*\{\s*release\s*\{)/, "$1\n            signingConfig signingConfigs.release");
  g = g.replace(/buildTypes\s*\{/, `signingConfigs {
        release {
            storeFile file(System.getenv("KEYSTORE_FILE") ?: "release.jks")
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
    buildTypes {`);
}
fs.writeFileSync(f, g);
console.log("build.gradle prêt : version", name, "(" + code + ")");
