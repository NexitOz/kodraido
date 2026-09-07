import { test, expect } from '@playwright/test'

for (const [name, width, height] of [['mobile-360',360,800],['mobile-390',390,844],['tablet',768,900],['desktop',1440,900]]) {
  test(`${name} layout`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /код райдо/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /слушать/i })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })
}

test('music chooser and release selection', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /слушать/i }).click()
  await expect(page.getByRole('heading', { name: /где слушаем/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /яндекс музыка/i })).toHaveAttribute('href', /music\.yandex\.ru/)
  await page.getByRole('button', { name: 'Закрыть' }).click()
  await page.getByRole('button', { name: /выбрать релиз «повелитель тайн»/i }).click()
  await expect(page.locator('.release-card.active .card-title')).toHaveText('Повелитель тайн')
})

test('video opens and closes', async ({ page }) => {
  await page.goto('/#media')
  await page.getByRole('button', { name: /смотреть видеошот/i }).click()
  await expect(page.locator('.video-dialog')).toBeVisible()
  await page.getByRole('button', { name: /закрыть видео/i }).click()
  await expect(page.locator('.video-dialog')).not.toBeVisible()
})

test('screenshots', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.screenshot({ path: 'artifacts/desktop.png', fullPage: false })
  await page.screenshot({ path: 'artifacts/desktop-page.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.screenshot({ path: 'artifacts/mobile.png', fullPage: false })
  await page.screenshot({ path: 'artifacts/mobile-page.png', fullPage: true })
})
