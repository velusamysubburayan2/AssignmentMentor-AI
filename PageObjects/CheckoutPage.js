import { expect } from '@playwright/test';

export class CheckoutPage {
  constructor(page) {
    this.page = page;
    this.paymentMethodHeading = page.getByText('Payment Method', { exact: true });
    this.shippingInformationHeading = page.getByText('Shipping Information', { exact: true });
    this.countryInput = page.getByPlaceholder('Select Country');
    this.indiaSuggestion = page.getByRole('button', { name: /India$/i }).last();
    this.placeOrderControl = page.getByText('Place Order', { exact: true });
  }

  async verifyCheckout(username, item) {
    await expect(this.paymentMethodHeading).toBeVisible();
    await expect(this.shippingInformationHeading).toBeVisible();
    await expect(this.page.getByText(username, { exact: true })).toBeVisible();
    await expect(this.page.getByText(`Quantity: ${item.quantity}`, { exact: true })).toBeVisible();
  }

  async selectIndia() {
    await this.countryInput.click();
    await this.countryInput.fill('');
    await this.countryInput.pressSequentially('India', { delay: 100 });
    await expect(this.indiaSuggestion).toBeVisible();
    await this.indiaSuggestion.click();
    await expect(this.countryInput).toHaveValue('India');
  }

  async placeOrder() {
    const orderResponsePromise = this.page.waitForResponse(response =>
      response.request().method() === 'POST' &&
      /\/api\/ecom\/order\/create-order$/.test(new URL(response.url()).pathname)
    );
    await this.placeOrderControl.click();
    const orderResponse = await orderResponsePromise;
    await expect(this.page).toHaveURL(/#\/dashboard\/thanks/);
    return orderResponse;
  }
}
