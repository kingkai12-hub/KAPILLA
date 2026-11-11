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
const LOGO = path.join(ROOT, 'public', 'kapila logo.png');
const OUT = path.join(ROOT, 'assets');

// The logo artwork is dark blue/black, so it needs a light background to stay
// visible — matching the light branding areas used across the portal.
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
  const resized = await sharp(logo)
    .resize({ width: Math.round(size * widthRatio), fit: 'inside' })
    .toBuffer();
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

  // Adaptive icon layers (Android 8+).
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: LIGHT } })
    .png()
    .toFile(path.join(OUT, 'icon-background.png'));
  console.log('  icon-background.png  1024x1024');
  await placeLogo(1024, 0.6, null, 'icon-foreground.png');

  // Launch splash (portrait + landscape variants are derived by the generator).
  await placeLogo(2732, 0.34, LIGHT, 'splash.png');

  console.log('Done. Next: npx @capacitor/assets generate --android');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
