import { _electron as electron } from 'playwright'

const app = await electron.launch({ args: ['.'] })
const win = await app.firstWindow()
await win.waitForLoadState('domcontentloaded')
await win.waitForSelector('.ProseMirror', { timeout: 10000 })

const editor = win.locator('.ProseMirror')
await editor.click()

await win.keyboard.type('Check [Tiptap](https://tiptap.dev) for more.')
console.log('--- after typing markdown link syntax ---')
console.log(await editor.innerHTML())

// Click into the link text to check the live-preview reveal.
await editor.locator('a', { hasText: 'Tiptap' }).click()
await win.waitForTimeout(50)
console.log('--- cursor inside the link (expect [ ](url) revealed) ---')
console.log(await editor.innerHTML())

await win.screenshot({ path: process.argv[2] })
await app.close()
