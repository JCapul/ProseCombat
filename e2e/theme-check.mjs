import { _electron as electron } from 'playwright'

const app = await electron.launch({ args: ['.'] })
const win = await app.firstWindow()
await win.waitForLoadState('domcontentloaded')
await win.waitForSelector('.ProseMirror', { timeout: 10000 })

await win.locator('button', { hasText: 'Settings' }).click()
await win.waitForSelector('.settings-panel')

async function setColorInput(locator, hex) {
  await locator.evaluate((el, value) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    setter.call(el, value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }, hex)
}

const bgInput = win.locator('.settings-panel label', { hasText: 'Background color' }).locator('input[type="color"]')
await setColorInput(bgInput, '#102040')
await win.waitForTimeout(100)

const bgValueAfterSet = await bgInput.inputValue()
console.log('bg input value after set:', bgValueAfterSet)

const bodyBgAfterBgChange = await win.evaluate(() => getComputedStyle(document.body).backgroundColor)
console.log('body bg right after color input change:', bodyBgAfterBgChange)

const appShellStyle = await win.evaluate(() => document.querySelector('.app-shell')?.getAttribute('style'))
console.log('.app-shell inline style:', appShellStyle)

const textInput = win.locator('.settings-panel label', { hasText: 'Text color' }).locator('input[type="color"]')
await setColorInput(textInput, '#ffdd88')
await win.waitForTimeout(100)

await win.locator('.settings-panel button', { hasText: 'Close' }).click()
await win.waitForTimeout(150)

const appShellStyle2 = await win.evaluate(() => document.querySelector('.app-shell')?.getAttribute('style'))
console.log('.app-shell inline style after close:', appShellStyle2)
const bodyBgFinal = await win.evaluate(() => getComputedStyle(document.body).backgroundColor)
console.log('body bg final:', bodyBgFinal)

await win.screenshot({ path: process.argv[2] })
await app.close()
