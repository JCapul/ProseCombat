import { _electron as electron } from 'playwright'

const app = await electron.launch({ args: ['.'] })
const win = await app.firstWindow()
await win.waitForLoadState('domcontentloaded')
await win.waitForSelector('.ProseMirror', { timeout: 10000 })

const editor = win.locator('.ProseMirror')
await editor.click()

const spellcheckAttr = await editor.getAttribute('spellcheck')
console.log('spellcheck attribute on .ProseMirror:', spellcheckAttr)

await win.keyboard.type('This sentnce has an obvoius mispelling in it.')
await win.waitForTimeout(300)

await win.screenshot({ path: process.argv[2] })
await app.close()
