/**
 * Generates the source images for the native Android app (app icon + launch
 * splash) from the transparent brand logo. The output in `assets/` is then
 * consumed by `@capacitor/assets` to produce every density variant.
 *
 * Run: node scripts/generate-app-assets.cjs
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const LOGO = path.join(ROOT, 'assets', 'source', 'kapilla-lion.png');
const OUT = path.join(ROOT, 'assets');
const ANDROID_RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');
const WEB = path.join(ROOT, 'public');

// The lion artwork is brand blue (#0E45A3), so it needs a light background to
// stay legible — matching the white splash and white header used across the
// portal. Blue-on-navy measures only ~1.5:1 contrast and reads as muddy.
const LIGHT = { r: 255, g: 255, b: 255, alpha: 1 };
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

async function trimmedLogo() {
  const source = sharp(LOGO);
  try {
    // Remove the surrounding transparent margin so the artwork fills the frame
    // predictably regardless of padding baked into the source file.
    return await source.trim({ threshold: 10 }).png().toBuffer();
  } catch {
    return await source.png().toBuffer();
  }
}

async function placeLogo(size, widthRatio, background, outPath) {
  const logo = await trimmedLogo();
  const box = Math.round(size * widthRatio);
  // Constrain the longest side to the box so the safe-zone ratios below hold
  // for artwork that is taller than it is wide (the lion is 679x790).
  const resized = await sharp(logo).resize({ width: box, height: box, fit: 'inside' }).toBuffer();
  const { width = 0, height = 0 } = await sharp(resized).metadata();

  await sharp({
    create: { width: size, height: size, channels: 4, background: background || TRANSPARENT },
  })
    .composite([
      {
        input: resized,
        left: Math.round((size - width) / 2),
        top: Math.round((size - height) / 2),
      },
    ])
    .png()
    .toFile(outPath);

  console.log(`  ${path.relative(ROOT, outPath)}  ${size}x${size}`);
}

// The native launch screen (res/drawable-*/splash_logo.png) is a centred bitmap
// layer, so it needs one file per density rather than a single full-bleed sheet.
const SPLASH_SIZES = {
  mdpi: 130,
  hdpi: 195,
  xhdpi: 290,
  xxhdpi: 430,
  xxxhdpi: 575,
};

async function writeSplashLogos() {
  for (const [density, size] of Object.entries(SPLASH_SIZES)) {
    const dir = path.join(ANDROID_RES, `drawable-${density}`);
    fs.mkdirSync(dir, { recursive: true });
    await placeLogo(size, 0.72, null, path.join(dir, 'splash_logo.png'));
  }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  console.log('Generating native app assets...');

  // Legacy / Play Store listing icon — full-bleed light background.
  await placeLogo(1024, 0.72, LIGHT, path.join(OUT, 'icon-only.png'));

  // Adaptive icon layers (Android 8+). The generator insets both layers by
  // 16.7%, so the foreground stays inside Android's central safe zone.
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: LIGHT } })
    .png()
    .toFile(path.join(OUT, 'icon-background.png'));
  console.log('  assets/icon-background.png  1024x1024');
  await placeLogo(1024, 0.66, null, path.join(OUT, 'icon-foreground.png'));

  // No splash source is emitted on purpose. The native launch screen is the
  // hand-written layer-list in res/drawable/splash.xml, so a generated
  // splash.png would collide with it as a duplicate @drawable/splash.
  await writeSplashLogos();

  // Web/PWA mark: the loading screen and the install manifest both render the
  // logo as a square, so they need the lion on its own rather than the wide
  // crest-and-wordmark lockup used in print headers.
  await placeLogo(512, 0.72, null, path.join(WEB, 'logo-mark.png'));

  console.log('Done. Next: npx @capacitor/assets generate --android');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
