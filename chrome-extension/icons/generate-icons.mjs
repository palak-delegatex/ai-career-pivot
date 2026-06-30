import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = join(__dirname, 'icon-master.svg');
const svgBuffer = readFileSync(svgPath);

const sizes = [16, 32, 48, 128];

async function generateIcons() {
  for (const size of sizes) {
    const outPath = join(__dirname, `icon-${size}.png`);
    await sharp(svgBuffer, { density: 300 })
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outPath);
    console.log(`Generated ${outPath} (${size}x${size})`);
  }
}

generateIcons().catch(console.error);
