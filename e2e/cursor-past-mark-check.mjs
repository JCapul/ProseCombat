import { _electron as electron } from 'playwright'

const app = await electron.launch({ args: ['.'] })
const win = await app.firstWindow()
await win.waitForLoadState('domcontentloaded')
await win.waitForSelector('.ProseMirror', { timeout: 10000 })

const editor = win.locator('.ProseMirror')
await editor.click()

// Type text ending with an italic span at the very end of the line — the
// reported bug scenario.
await win.keyboard.type('This ends with ')
await win.keyboard.type('*hello*')
console.log('--- after typing (cursor at end, inside the mark) ---')
console.log(await editor.innerHTML())

// Move left into the middle of "hello", then attempt to walk right past the
// closing marker and keep typing — this is exactly what the user described
// as broken (cursor snapping back to the left of the last mark).
await win.keyboard.press('ArrowLeft')
await win.keyboard.press('ArrowLeft')
await win.waitForTimeout(30)
console.log('--- cursor moved 2 left (should be inside "hello") ---')
console.log(await editor.innerHTML())

// Walk all the way to the end via repeated ArrowRight, logging each step.
for (let i = 0; i < 4; i++) {
  await win.keyboard.press('ArrowRight')
  await win.waitForTimeout(30)
  const html = await editor.innerHTML()
  console.log(`--- after ArrowRight #${i + 1} ---`)
  console.log(html)
}

// Now try to type more text — if the cursor is really stuck before the
// closing marker, this text will land INSIDE the italic span instead of
// after it as plain text.
await win.keyboard.type(' MORE')
console.log('--- after typing " MORE" ---')
console.log(await editor.innerHTML())

await win.screenshot({ path: process.argv[2] })
await app.close()
