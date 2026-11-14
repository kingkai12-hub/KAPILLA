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

async function placeLogo(size, widthRatio, background, file) {
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
    .toFile(path.join(OUT, file));

  console.log(`  ${file}  ${size}x${size}`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  console.log('Generating native app assets...');

  // Legacy / Play Store listing icon — full-bleed light background.
  await placeLogo(1024, 0.72, LIGHT, 'icon-only.png');

  // Adaptive icon layers (Android 8+). The generator insets both layers by
  // 16.7%, so the foreground stays inside Android's central safe zone.
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: LIGHT } })
    .png()
    .toFile(path.join(OUT, 'icon-background.png'));
  console.log('  icon-background.png  1024x1024');
  await placeLogo(1024, 0.66, null, 'icon-foreground.png');

  // No splash source is emitted on purpose. The native launch screen is the
  // hand-written layer-list in res/drawable/splash.xml, so a generated
  // splash.png would collide with it as a duplicate @drawable/splash.

  console.log('Done. Next: npx @capacitor/assets generate --android');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
