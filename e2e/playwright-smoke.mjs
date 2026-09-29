import { _electron as electron } from 'playwright'

const app = await electron.launch({ args: ['.'] })
const win = await app.firstWindow()
await win.waitForLoadState('domcontentloaded')
await win.screenshot({ path: process.argv[2] })
console.log('title:', await win.title())
console.log('toolbar text:', await win.locator('.app-toolbar').innerText().catch(() => '(not found)'))
await app.close()
