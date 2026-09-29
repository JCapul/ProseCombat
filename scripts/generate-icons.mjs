import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import png2icons from 'png2icons'
import sharp from 'sharp'

const here = dirname(fileURLToPath(import.meta.url))
const buildDir = join(here, '..', 'build')
const svgPath = join(buildDir, 'icon.svg')
const pngPath = join(buildDir, 'icon.png')
const iconsDir = join(buildDir, 'icons')

mkdirSync(iconsDir, { recursive: true })

// Master 1024x1024 PNG (source of truth for everything else).
await sharp(svgPath).resize(1024, 1024).png().toFile(pngPath)

const input = readFileSync(pngPath)

// Windows: mixed BMP/PNG variant recommended by png2icons for embedding in an
// Electron executable (small sizes as BMP for pre-Win10 compatibility, larger
// sizes as PNG to keep file size down).
const ico = png2icons.createICO(input, png2icons.BICUBIC2, 0, false, true)
if (!ico) throw new Error('Failed to generate .ico')
writeFileSync(join(buildDir, 'icon.ico'), ico)

// macOS.
const icns = png2icons.createICNS(input, png2icons.BICUBIC2, 0)
if (!icns) throw new Error('Failed to generate .icns')
writeFileSync(join(buildDir, 'icon.icns'), icns)

// Linux (electron-builder's linux target wants a directory of PNGs named by
// size when not using a single icon, which also covers other consumers like
// desktop file managers / taskbars at whatever size they ask for).
const linuxSizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024]
for (const size of linuxSizes) {
  await sharp(svgPath).resize(size, size).png().toFile(join(iconsDir, `${size}x${size}.png`))
}

console.log('Generated build/icon.png, build/icon.ico, build/icon.icns, build/icons/*.png')
