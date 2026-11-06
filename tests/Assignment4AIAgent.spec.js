import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const applicationUrl = 'https://eventhub.rahulshettyacademy.com/login';

test('book an event and verify the booking', async ({ page }) => {
  const username = process.env.EVENTHUB_USERNAME;
  const password = process.env.EVENTHUB_PASSWORD;

  if (!username || !password) {
    throw new Error('Set EVENTHUB_USERNAME and EVENTHUB_PASSWORD before running this test.');
  }

  await page.goto(applicationUrl, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email', { exact: true }).fill(username);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await page.waitForLoadState('networkidle');

  const browseEventsButton = page.getByRole('button', { name: /Browse Events/i });
  await expect(browseEventsButton).toBeVisible();
  await browseEventsButton.click();
  await page.waitForURL(/events/i);
  await page.waitForLoadState('networkidle');

  const bookNowButtons = page.getByRole('button', { name: /Book now/i });
  await expect(bookNowButtons.first()).toBeVisible();
  expect(await bookNowButtons.count()).toBeGreaterThan(0);

  const firstBookNowButton = bookNowButtons.first();
  const eventTitleLocator = firstBookNowButton
    .locator('xpath=ancestor::*[.//h1 or .//h2 or .//h3 or .//h4][1]')
    .getByRole('heading')
    .first();
  const eventTitle = (await eventTitleLocator.innerText()).trim();
  expect(eventTitle).not.toBe('');

  await firstBookNowButton.click();
  await page.waitForLoadState('networkidle');
  await expect(page.getByText(eventTitle, { exact: true })).toBeVisible();

  await page.getByLabel(/full name/i).fill('Subburayan Velusamy');
  await page.getByLabel('Email', { exact: true }).fill(username);
  await page.getByLabel(/phone/i).fill('9080751313');

  const ticketCountInput = page.getByRole('spinbutton');
  await expect(ticketCountInput).toBeVisible();
  await ticketCountInput.fill('2');
  await expect(ticketCountInput).toHaveValue('2');

  await page.getByRole('button', { name: /Confirm Booking/i }).click();
  await page.waitForLoadState('networkidle');
  await expect(page.getByText(/booking confirmed/i).first()).toBeVisible();

  const confirmationText = await page.locator('body').innerText();
  const bookingRefMatch = confirmationText.match(
    /(?:booking\s*(?:ref(?:erence)?|id)|reference(?:\s*(?:id|number|no\.?))?)\s*[:#-]?\s*([A-Z0-9-]+)/i
  );
  const bookingPriceMatch = confirmationText.match(
    /(?:total\s*(?:price|amount)|price|amount)\s*[:\-]?\s*((?:(?:₹|Rs\.?|[$€£])\s*)?\d[\d,]*(?:\.\d{1,2})?)/i
  );
  const ticketCountMatch = confirmationText.match(/(?:tickets?|quantity)\s*[:\-]?\s*(\d+)/i);

  expect(bookingRefMatch, 'booking confirmation should include a booking reference').toBeTruthy();
  expect(bookingPriceMatch, 'booking confirmation should include a price').toBeTruthy();
  expect(ticketCountMatch, 'booking confirmation should include the ticket count').toBeTruthy();

  const bookingRef = bookingRefMatch[1];
  const bookingPrice = bookingPriceMatch[1].trim();
  const ticketCount = Number(ticketCountMatch[1]);
  expect(ticketCount).toBe(2);

  await page.getByText('View My Bookings', { exact: true }).click();
  await page.waitForLoadState('networkidle');

  const selectedBooking = page.getByText(bookingRef, { exact: true });
  await expect(selectedBooking).toBeVisible();
  await selectedBooking.click();
  await page.waitForLoadState('networkidle');

  const bookingDetails = await page.locator('body').innerText();
  expect(bookingDetails).toContain(bookingRef);
  expect(bookingDetails).toContain(bookingPrice);
  expect(bookingDetails).toMatch(new RegExp(`(?:tickets?|quantity)\\s*[:\\-]?\\s*${ticketCount}`, 'i'));
});