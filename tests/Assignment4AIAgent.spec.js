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
});