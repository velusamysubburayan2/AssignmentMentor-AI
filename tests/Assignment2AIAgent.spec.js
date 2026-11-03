import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { LoginPage } from '../PageObjects/LoginPage.js';
import { HomePage } from '../PageObjects/HomePage.js';
import { CartPage } from '../PageObjects/CartPage.js';
import { CheckoutPage } from '../PageObjects/CheckoutPage.js';
import { OrderConfirmationPage } from '../PageObjects/OrderConfirmationPage.js';

dotenv.config();

test.use({
  viewport: { width: 1920, height: 1080 },
});

test('complete purchase and verify the order details', async ({ page }) => {
  const username = process.env.SHOP_USERNAME;
  const password = process.env.SHOP_PASSWORD;

  if (!username || !password) {
    throw new Error('Set SHOP_USERNAME and SHOP_PASSWORD before running this test.');
  }

  const loginPage = new LoginPage(page);
  const homePage = new HomePage(page);
  const cartPage = new CartPage(page);
  const checkoutPage = new CheckoutPage(page);
  const orderConfirmationPage = new OrderConfirmationPage(page);

  await page.goto('https://rahulshettyacademy.com/client/#/auth/login');
  const loginResponse = await loginPage.login(username, password);
  expect(loginResponse.ok()).toBeTruthy();

  const productCount = await homePage.getProductCount();
  expect(productCount).toBeGreaterThan(1);
  const productTitle = await homePage.getFirstProductTitle();
  const addToCartResponse = await homePage.addFirstProductToCart();
  expect(addToCartResponse.ok()).toBeTruthy();

  const cartProductsResponse = await homePage.openCart();
  expect(cartProductsResponse.ok()).toBeTruthy();
  const cartPayload = await cartProductsResponse.json();
  const cartProductNames = (cartPayload.products || []).map(product => product.productName);
  expect(cartProductNames).toContain(productTitle);

  const cartItem = await cartPage.getCartItem(productTitle);
  expect(cartItem.title).toBe(productTitle);

  await cartPage.proceedToCheckout();
  await checkoutPage.verifyCheckout(username, cartItem);
  await checkoutPage.selectIndia();

  const createOrderResponse = await checkoutPage.placeOrder();
  expect(createOrderResponse.status()).toBe(201);
  await orderConfirmationPage.verifyOrder(cartItem);
});