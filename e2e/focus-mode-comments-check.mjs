import { _electron as electron } from 'playwright'

const app = await electron.launch({ args: ['.'] })
const win = await app.firstWindow()
await win.waitForLoadState('domcontentloaded')
await win.waitForSelector('.ProseMirror', { timeout: 10000 })

console.log('before focus mode:')
console.log('  toolbar present:', (await win.locator('.app-toolbar').count()) > 0)
console.log('  comments-margin present:', (await win.locator('.comments-margin').count()) > 0)

await win.locator('button', { hasText: 'Focus mode' }).click()
await win.waitForTimeout(400)

console.log('in focus mode:')
console.log('  toolbar present:', (await win.locator('.app-toolbar').count()) > 0)
console.log('  comments-margin present:', (await win.locator('.comments-margin').count()) > 0)

await win.screenshot({ path: process.argv[2] })
await app.close()
