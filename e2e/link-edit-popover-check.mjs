import { _electron as electron } from 'playwright'

const app = await electron.launch({ args: ['.'] })
const win = await app.firstWindow()
await win.waitForLoadState('domcontentloaded')
await win.waitForSelector('.ProseMirror', { timeout: 10000 })

const editor = win.locator('.ProseMirror')
await editor.click()

await win.keyboard.type('Check [Tiptap](https://tiptap.dev) for more.')
await editor.locator('a', { hasText: 'Tiptap' }).click()
await win.waitForTimeout(80)

const popover = win.locator('.link-edit-popover')
console.log('popover visible after clicking into link:', await popover.isVisible())
const input = popover.locator('input')
console.log('input value (should be the current href):', await input.inputValue())

// Edit the URL.
await input.fill('')
await input.type('https://example.org/changed')
await input.press('Enter')
await win.waitForTimeout(80)

console.log('--- HTML after editing URL via popover ---')
console.log(await editor.innerHTML())

// Click back into the link to confirm popover now shows the new URL.
await editor.locator('a', { hasText: 'Tiptap' }).click()
await win.waitForTimeout(80)
console.log('input value after re-opening:', await popover.locator('input').inputValue())

// Move cursor away — popover should disappear.
await win.keyboard.press('End')
await win.waitForTimeout(80)
console.log('popover visible after moving cursor away:', await popover.isVisible())

// Test "Remove link".
await editor.locator('a', { hasText: 'Tiptap' }).click()
await win.waitForTimeout(80)
await popover.locator('button', { hasText: 'Remove link' }).click()
await win.waitForTimeout(80)
console.log('--- HTML after Remove link ---')
console.log(await editor.innerHTML())

await win.screenshot({ path: process.argv[2] })
await app.close()
