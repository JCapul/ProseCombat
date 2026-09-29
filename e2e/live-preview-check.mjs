import { _electron as electron } from 'playwright'

const app = await electron.launch({ args: ['.'] })
const win = await app.firstWindow()
await win.waitForLoadState('domcontentloaded')
await win.waitForSelector('.ProseMirror', { timeout: 10000 })

const editor = win.locator('.ProseMirror')
await editor.click()

// Type a heading, then a paragraph with bold/italic/code/link source text.
await win.keyboard.type('# Hello World')
await win.keyboard.press('Enter')
await win.keyboard.type('This is **bold**, *italic*, `code`, and a [link](https://example.com) here.')

await win.screenshot({ path: process.argv[2] })

// Move cursor into the middle of "bold" and screenshot — syntax should reveal.
const html = await editor.innerHTML()
console.log('--- editor HTML after typing ---')
console.log(html)

// Click directly on the word "bold" in the rendered text.
const boldEl = editor.locator('strong', { hasText: 'bold' })
const boldCount = await boldEl.count()
console.log('bold element count:', boldCount)
if (boldCount > 0) {
  const box = await boldEl.first().boundingBox()
  if (box) {
    await win.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    await win.screenshot({ path: process.argv[3] })
    console.log('--- editor HTML with cursor in bold ---')
    console.log(await editor.innerHTML())
  }
}

// Click on the heading line to check block marker reveal.
const heading = editor.locator('h1')
const hbox = await heading.first().boundingBox()
if (hbox) {
  await win.mouse.click(hbox.x + hbox.width / 2, hbox.y + hbox.height / 2)
  await win.screenshot({ path: process.argv[4] })
  console.log('--- editor HTML with cursor in heading ---')
  console.log(await editor.innerHTML())
}

await app.close()
