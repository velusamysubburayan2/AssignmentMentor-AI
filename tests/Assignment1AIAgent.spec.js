const fs = require('node:fs/promises');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
import dotenv from 'dotenv';

dotenv.config();
test.use({
  viewport: { width: 1920, height: 1080 },
  launchOptions: {
    args: ['--start-maximized'],
  },
});

test('complete product purchase and verify order confirmation', async ({ page }) => {
  const username = process.env.SHOP_USERNAME;
  const password = process.env.SHOP_PASSWORD;
  if (!username || !password) {
    throw new Error('Set SHOP_USERNAME and SHOP_PASSWORD before running this test.');
  }

  const screenshotDirectory = path.join(__dirname, 'Screenshot');
  await fs.mkdir(screenshotDirectory, { recursive: true });
  const screenshot = async (name) => {
    await page.screenshot({
      path: path.join(screenshotDirectory, name),
      fullPage: true,
    });
  };

  await page.goto('https://rahulshettyacademy.com/client/#/auth/login', {
    waitUntil: 'networkidle',
  });
  await screenshot('01-login.png');
  await page.locator('#userEmail').fill(username);
  await page.locator('#userPassword').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/#\/dashboard\/dash/);

  const products = page.locator('.card');
  await expect(products.first()).toBeVisible();
  const productCount = await products.count();
  expect(productCount).toBeGreaterThan(1);
  const firstProduct = products.first();
  const productTitle = (await firstProduct.locator('h5').innerText()).trim();
  await screenshot('02-catalog.png');

  const addToCartResponsePromise = page.waitForResponse(response =>
    response.request().method() === 'POST' && /add-to-cart/i.test(response.url())
  );
  await firstProduct.getByRole('button', { name: /Add To Cart/i }).click();
  const addToCartResponse = await addToCartResponsePromise;
  expect(
    addToCartResponse.ok(),
    `Add-to-cart request failed with status ${addToCartResponse.status()}`
  ).toBeTruthy();
  const cartButton = page.getByRole('navigation').getByRole('button', { name: /Cart/ });
  await expect(cartButton).toBeVisible();
  const cartProductsResponsePromise = page.waitForResponse(response =>
    response.request().method() === 'GET' &&
    /\/api\/ecom\/user\/get-cart-products\//i.test(response.url())
  );
  await cartButton.click();
  await expect(page).toHaveURL(/#\/dashboard\/cart/);
  const cartProductsResponse = await cartProductsResponsePromise;
  expect(
    cartProductsResponse.ok(),
    `Cart products request failed with status ${cartProductsResponse.status()}`
  ).toBeTruthy();
  const cartPayload = await cartProductsResponse.json();
  const cartProductNames = (cartPayload.products || []).map(product => product.productName);
  expect(
    cartProductNames,
    `Cart API returned no ${productTitle}; received: ${cartProductNames.join(', ') || 'no products'}`
  ).toContain(productTitle);

  const cartProduct = page.locator('li.items').filter({ has: page.getByRole('heading', { name: productTitle }) });
  await expect(cartProduct).toBeVisible();
  await expect(cartProduct.getByRole('heading', { name: productTitle })).toBeVisible();
  const cartItems = [{
    title: productTitle,
    quantity: 1,
    price: (await cartProduct.locator('.prodTotal p').innerText()).trim(),
  }];
  await screenshot('03-cart.png');

  await page.getByRole('button', { name: /Checkout/ }).click();
  await expect(page).toHaveURL(/#\/dashboard\/order/);
  await expect(page.getByText('Payment Method', { exact: true })).toBeVisible();
  await expect(page.getByText(username, { exact: true })).toBeVisible();
  await expect(page.getByText(`Quantity: ${cartItems[0].quantity}`, { exact: true })).toBeVisible();
  await screenshot('04-checkout.png');

  const countryInput = page.getByPlaceholder('Select Country');
  await countryInput.click();
  await countryInput.press('Control+A');
  await countryInput.pressSequentially('India', { delay: 100 });
  const indiaOption = page.locator('button.ta-item').last();
  await expect(indiaOption).toContainText('India');
  await indiaOption.click();
  await expect(countryInput).toHaveValue('India');
  await page.locator('a.action__submit').click();
  await expect(page).toHaveURL(/#\/dashboard\/thanks/);
  await expect(page.getByText('Thankyou for the order.', { exact: false })).toBeVisible();
  await screenshot('05-order-confirmation.png');

  const confirmation = await page.locator('body').first().innerText();
  const orderId = confirmation.match(/\b[a-f0-9]{24}\b/i)?.[0];
  expect(orderId, 'confirmation page should include the new order ID').toBeTruthy();

  const downloadPromise = page.waitForEvent('download');
  await page.getByText(/Click To Download Order Details in CSV/i).click();
  const orderDownload = await downloadPromise;
  const orderCsv = (await fs.readFile(await orderDownload.path(), 'utf8')).toUpperCase();
  for (const item of cartItems) {
    expect(orderCsv).toContain(item.title.toUpperCase());
    expect(orderCsv).toContain(String(item.quantity));
    const expectedPrice = item.price.replace(/[^\d.]/g, '');
    const csvNumbers = orderCsv.replace(/[^\d.]/g, '');
    expect(csvNumbers).toContain(expectedPrice);
  }

  await page.getByRole('button', { name: /ORDERS/ }).click();
  await expect(page).toHaveURL(/#\/dashboard\/myorders/);
  const orderRow = page.locator('tbody tr').filter({ hasText: orderId });
  await expect(orderRow).toBeVisible();
  for (const item of cartItems) {
    await expect(orderRow).toContainText(item.title);
    await expect(orderRow).toContainText(item.price.replace('$', '').trim());
  }
  await screenshot('06-order-history.png');
});
