import { expect } from '@playwright/test';

export class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.getByPlaceholder('email@example.com');
    this.passwordInput = page.getByPlaceholder('enter your passsword');
    this.loginButton = page.getByRole('button', { name: 'Login' });
  }

  async login(username, password) {
    await this.emailInput.fill(username);
    await this.passwordInput.fill(password);

    const loginResponsePromise = this.page.waitForResponse(response =>
      response.request().method() === 'POST' &&
      /\/api\/ecom\/auth\/login$/.test(new URL(response.url()).pathname)
    );
    await this.loginButton.click();
    const loginResponse = await loginResponsePromise;
    await expect(this.page).toHaveURL(/#\/dashboard\/dash/);
    return loginResponse;
  }
}
