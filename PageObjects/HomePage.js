import { expect } from '@playwright/test';

export class HomePage {
  constructor(page) {
    this.page = page;
    this.productHeadings = page.getByRole('heading', { level: 5 });
    this.addToCartButtons = page.getByRole('button', { name: /Add To Cart/i });
    this.cartButton = page.getByRole('navigation').getByRole('button', { name: /Cart/ });
  }

  async getProductCount() {
    await expect(this.productHeadings.first()).toBeVisible();
    return this.productHeadings.count();
  }

  async getFirstProductTitle() {
    return (await this.productHeadings.first().innerText()).trim();
  }

  async addFirstProductToCart() {
    const addToCartResponsePromise = this.page.waitForResponse(response =>
      response.request().method() === 'POST' &&
      /\/api\/ecom\/user\/add-to-cart$/.test(new URL(response.url()).pathname)
    );
    await this.addToCartButtons.first().click();
    return addToCartResponsePromise;
  }

  async openCart() {
    const cartProductsResponsePromise = this.page.waitForResponse(response =>
      response.request().method() === 'GET' &&
      /\/api\/ecom\/user\/get-cart-products\//i.test(response.url())
    );
    await this.cartButton.click();
    await expect(this.page).toHaveURL(/#\/dashboard\/cart/);
    return cartProductsResponsePromise;
  }
}
