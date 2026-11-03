import { expect } from '@playwright/test';

export class CartPage {
  constructor(page) {
    this.page = page;
    this.checkoutButton = page.getByRole('button', { name: /Checkout/ });
    this.currencyText = /^\$\s*[\d,]+(?:\.\d{2})?$/;
  }

  async getCartItem(title) {
    const cartProduct = this.page.getByRole('listitem').filter({
      has: this.page.getByRole('heading', { name: title, exact: true }),
    });
    await expect(cartProduct).toBeVisible();
    const titleHeading = cartProduct.getByRole('heading', { name: title, exact: true });
    await expect(titleHeading).toBeVisible();

    return {
      title: (await titleHeading.innerText()).trim(),
      quantity: 1,
      price: (await cartProduct.getByText(this.currencyText).last().innerText()).trim(),
    };
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
    await expect(this.page).toHaveURL(/#\/dashboard\/order/);
  }
}
