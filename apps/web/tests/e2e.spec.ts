import { test, expect } from '@playwright/test'

test('home → PDP → cart → checkout init', async ({ page }) => {
  await page.goto('/')
  // Open first product PDP
  const first = page.locator('a[href^="/product/"]').first()
  await first.waitFor({ state: 'visible' })
  await first.click()

  // Add first variant to cart (accept alert)
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Add' }).first().click()

  // Go to cart
  await page.goto('/cart')
  // Select first available slot option (skip placeholder)
  const select = page.locator('select')
  await select.waitFor()
  const options = await select.locator('option').all()
  if (options.length > 1) {
    await select.selectOption({ index: 1 })
  }

  // Attempt checkout
  const checkout = page.getByRole('button', { name: 'Checkout' })
  await checkout.click()
  // Either we see Stripe clientSecret or redirect occurs; allow a brief wait
  await expect(
    page.locator('text=Stripe clientSecret').or(page.locator('text=Checkout started')),
  ).toBeVisible({ timeout: 10_000 })
})
