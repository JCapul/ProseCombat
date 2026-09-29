import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const svgPath = process.argv[2] ?? join(here, '..', 'build', 'icon.svg')
const outDir = process.argv[3] ?? here

await sharp(svgPath).resize(1024, 1024).png().toFile(join(outDir, 'preview-1024.png'))
await sharp(svgPath).resize(64, 64).png().toFile(join(outDir, 'preview-64.png'))
await sharp(svgPath).resize(32, 32).png().toFile(join(outDir, 'preview-32.png'))
await sharp(svgPath).resize(16, 16).png().toFile(join(outDir, 'preview-16.png'))
console.log('rendered previews to', outDir)
