import { _electron as electron } from 'playwright'

const app = await electron.launch({ args: ['.'] })
const win = await app.firstWindow()
await win.waitForLoadState('domcontentloaded')
await win.waitForSelector('.ProseMirror', { timeout: 10000 })

async function isNativeFullScreen() {
  return app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isFullScreen())
}

console.log('native fullscreen before toggle:', await isNativeFullScreen())
console.log('toolbar visible before toggle:', await win.locator('.app-toolbar').isVisible())

// Toggle focus mode via the button.
await win.locator('button', { hasText: 'Focus mode' }).click()
await win.waitForTimeout(400)

console.log('native fullscreen after clicking Focus mode:', await isNativeFullScreen())
console.log('toolbar visible after toggle:', await win.locator('.app-toolbar').count())

// Exit fullscreen NOT via our button, but by calling setFullScreen(false)
// directly on the BrowserWindow — simulates an external exit (e.g. native
// Escape key) to verify the renderer syncs back correctly.
await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setFullScreen(false))
await win.waitForTimeout(400)

console.log('native fullscreen after external exit:', await isNativeFullScreen())
console.log('toolbar visible after external exit:', await win.locator('.app-toolbar').count())

await app.close()
