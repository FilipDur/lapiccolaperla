import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const inputDir = path.join(root, "images");
const outputDir = path.join(inputDir, "webp");
const thumbsDir = path.join(outputDir, "thumbs");

const photos = [
  "_DSR0003.jpg",
  "_DSR0014.jpg",
  "_DSR0022.jpg",
  "_DSR0023.jpg",
  "_DSR0026.jpg",
  "_DSR0048.jpg",
  "_DSR0057.jpg",
  "_DSR0076.jpg",
  "_DSR0080.jpg",
  "_DSR0090.jpg",
  "1.avif",
  "2.avif",
  "3.avif",
  "4.avif",
  "5.avif",
  "6.avif"
];

const logos = ["Logo.avif", "Logos.avif"];

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(thumbsDir, { recursive: true });

for (const file of photos) {
  const source = path.join(inputDir, file);
  const target = path.join(outputDir, `${path.parse(file).name}.webp`);

  await sharp(source)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 76, effort: 5 })
    .toFile(target);

  const thumbTarget = path.join(thumbsDir, `${path.parse(file).name}.webp`);

  await sharp(source)
    .rotate()
    .resize({ width: 520, withoutEnlargement: true })
    .webp({ quality: 68, effort: 5 })
    .toFile(thumbTarget);

  const { size } = await fs.stat(target);
  const { size: thumbSize } = await fs.stat(thumbTarget);
  console.log(
    `${file} -> ${path.relative(root, target)} (${Math.round(size / 1024)} KB), ${path.relative(root, thumbTarget)} (${Math.round(thumbSize / 1024)} KB)`
  );
}

for (const file of logos) {
  const source = path.join(inputDir, file);
  const target = path.join(outputDir, `${path.parse(file).name}.webp`);

  await sharp(source)
    .webp({ quality: 92, effort: 5 })
    .toFile(target);

  const { size } = await fs.stat(target);
  console.log(`${file} -> ${path.relative(root, target)} (${Math.round(size / 1024)} KB)`);
}
