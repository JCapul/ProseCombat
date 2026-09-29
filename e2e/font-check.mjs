import { _electron as electron } from 'playwright'

const app = await electron.launch({ args: ['.'] })
const win = await app.firstWindow()
await win.waitForLoadState('domcontentloaded')
await win.waitForSelector('.ProseMirror', { timeout: 10000 })

const editor = win.locator('.ProseMirror')
await editor.click()
await win.keyboard.type('The quick brown fox jumps over the lazy dog.')

// Check the default (Lora) actually loaded and is applied.
const loraStatus = await win.evaluate(async () => {
  await document.fonts.ready
  const loaded = [...document.fonts].map((f) => `${f.family} ${f.style} ${f.weight} [${f.status}]`)
  const computed = getComputedStyle(document.querySelector('.writing-column')).fontFamily
  return { loaded, computed }
})
console.log('fonts loaded:', JSON.stringify(loraStatus.loaded, null, 2))
console.log('writing-column computed font-family:', loraStatus.computed)

await win.screenshot({ path: process.argv[2] })

// Open settings, switch through each typeface, screenshot each.
await win.locator('button', { hasText: 'Settings' }).click()
await win.waitForSelector('.settings-panel')

const select = win.locator('.settings-panel label', { hasText: 'Typeface' }).locator('select')
const optionLabels = await select.locator('option').allTextContents()
console.log('dropdown options:', optionLabels)

for (const label of optionLabels) {
  await select.selectOption({ label })
  await win.waitForTimeout(150)
}

await select.selectOption({ label: 'Inter (sans)' })
await win.locator('.settings-panel button', { hasText: 'Close' }).click()
await win.waitForTimeout(150)

const interStatus = await win.evaluate(async () => {
  await document.fonts.ready
  return getComputedStyle(document.querySelector('.writing-column')).fontFamily
})
console.log('writing-column computed font-family after switching to Inter:', interStatus)

await win.screenshot({ path: process.argv[3] })
await app.close()
