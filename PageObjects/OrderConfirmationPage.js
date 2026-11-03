import { expect } from '@playwright/test';

export class OrderConfirmationPage {
  constructor(page) {
    this.page = page;
    this.confirmationMessage = page.getByText('Thankyou for the order.', { exact: false });
  }

  async verifyOrder(item) {
    await expect(this.confirmationMessage).toBeVisible();
    await expect(this.page.getByText(item.title, { exact: true })).toBeVisible();
    await expect(this.page.getByText(`Qty: ${item.quantity}`, { exact: true })).toBeVisible();
    await expect(this.page.getByText(item.price, { exact: true })).toBeVisible();
  }
}
