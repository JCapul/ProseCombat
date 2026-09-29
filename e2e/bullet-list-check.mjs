import { _electron as electron } from 'playwright'

const app = await electron.launch({ args: ['.'] })
const win = await app.firstWindow()
await win.waitForLoadState('domcontentloaded')
await win.waitForSelector('.ProseMirror', { timeout: 10000 })

const editor = win.locator('.ProseMirror')
await editor.click()

await win.keyboard.type('- item one')
await win.keyboard.press('Enter')
await win.keyboard.type('item two')

console.log('--- right after typing (cursor at end of item two) ---')
console.log(await editor.innerHTML())

// Click directly on the "item one" text via Playwright's own click (auto-computed point).
await editor.locator('li', { hasText: 'item one' }).locator('p').click()
await win.waitForTimeout(50)
console.log('--- clicked into item one via locator.click() ---')
console.log(await editor.innerHTML())

await editor.locator('li', { hasText: 'item two' }).locator('p').click()
await win.waitForTimeout(50)
console.log('--- clicked into item two via locator.click() ---')
console.log(await editor.innerHTML())

await win.screenshot({ path: process.argv[2] })
await app.close()
