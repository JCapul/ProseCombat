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
await win.keyboard.press('Enter')
await win.keyboard.press('Enter') // exit the list
await win.keyboard.type('> a quoted line')
await win.keyboard.press('Enter')
await win.keyboard.press('Enter')
await win.keyboard.type('1. first')
await win.keyboard.press('Enter')
await win.keyboard.type('second')

console.log('--- HTML after typing lists/blockquote ---')
console.log(await editor.innerHTML())

// Click into "item two" (second bullet)
const itemTwo = editor.locator('li', { hasText: 'item two' })
const itemTwoBox = await itemTwo.first().boundingBox()
if (itemTwoBox) {
  await win.mouse.click(itemTwoBox.x + 10, itemTwoBox.y + itemTwoBox.height / 2)
  console.log('--- cursor in bullet list item ---')
  console.log(await editor.innerHTML())
  await win.screenshot({ path: process.argv[2] })
}

// Click into blockquote
const quote = editor.locator('blockquote')
const quoteBox = await quote.first().boundingBox()
if (quoteBox) {
  await win.mouse.click(quoteBox.x + 10, quoteBox.y + quoteBox.height / 2)
  console.log('--- cursor in blockquote ---')
  console.log(await editor.innerHTML())
}

// Click into ordered list second item
const secondItem = editor.locator('li', { hasText: 'second' })
const secondBox = await secondItem.first().boundingBox()
if (secondBox) {
  await win.mouse.click(secondBox.x + 10, secondBox.y + secondBox.height / 2)
  console.log('--- cursor in ordered list item 2 ---')
  console.log(await editor.innerHTML())
}

// --- Theming check ---
await win.locator('button', { hasText: 'Settings' }).click()
await win.waitForSelector('.settings-panel')
const bgInput = win.locator('.settings-panel label', { hasText: 'Background color' }).locator('input[type="color"]')
await bgInput.evaluate((el) => {
  el.value = '#102040'
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
})
const textInput = win.locator('.settings-panel label', { hasText: 'Text color' }).locator('input[type="color"]')
await textInput.evaluate((el) => {
  el.value = '#ffdd88'
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
})
await win.locator('.settings-panel button', { hasText: 'Close' }).click()
await win.waitForTimeout(200)
await win.screenshot({ path: process.argv[3] })

const bgColor = await win.evaluate(() => getComputedStyle(document.body).backgroundColor)
console.log('computed body background:', bgColor)

await app.close()
