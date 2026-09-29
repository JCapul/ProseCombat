import { _electron as electron } from 'playwright'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const userDataDir = mkdtempSync(join(tmpdir(), 'prose-combat-fresh-'))

const app = await electron.launch({ args: ['.', `--user-data-dir=${userDataDir}`] })
const win = await app.firstWindow()
await win.waitForLoadState('domcontentloaded')
await win.waitForSelector('.ProseMirror', { timeout: 10000 })

const editor = win.locator('.ProseMirror')
await editor.click()
await win.keyboard.type('The quick brown fox jumps over the lazy dog.')
await win.waitForTimeout(200)

const info = await win.evaluate(async () => {
  await document.fonts.ready
  const computed = getComputedStyle(document.querySelector('.writing-column')).fontFamily
  const loraLoaded = document.fonts.check('16px Lora')
  return { computed, loraLoaded }
})
console.log('fresh-profile default font-family:', info.computed)
console.log('Lora actually usable (document.fonts.check):', info.loraLoaded)

await win.screenshot({ path: process.argv[2] })
await app.close()
