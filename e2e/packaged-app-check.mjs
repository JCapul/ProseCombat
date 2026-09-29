import { _electron as electron } from 'playwright'

const exePath = process.argv[2]
const app = await electron.launch({ executablePath: exePath })
const win = await app.firstWindow()
await win.waitForLoadState('domcontentloaded')
await win.waitForSelector('.ProseMirror', { timeout: 10000 })

console.log('title:', await win.title())
console.log('toolbar text:', await win.locator('.app-toolbar').innerText())

const editor = win.locator('.ProseMirror')
await editor.click()
await win.keyboard.type('Packaged app smoke test.')
console.log('typed content ok:', (await editor.innerText()).includes('Packaged app smoke test.'))

await win.screenshot({ path: process.argv[3] })
await app.close()
