PlayWright Coding Standard for Test Scripts:

Page Object Model design Pattern:
Create PageObject folder inside the project if folder is not exist.
1. Create a seperate classes for each application page used in the test and that file name must ends with Page.js if file not exist.
Example: LoginPage.js, HomePage.js,..
2. Inside each Classes, 
  .Create a constructor and Store all the page locators inside it.
  .Create methods for user interactions that related to the page.
  .Enable Export to the class so the test files can use these classes.
Example:
export class LoginPage {
  constructor(page) {
    this.page=page;
    this.username=this.page.getbyPlaceholder('#email');
    this.password=this.page.getbyPlaceholder('#password');
    this.submitButton=this.page.getbyRole('button',{name:'submit'});

  }

  async login(username, password) {
    await this.username.fill(username);
    await this.password.fill('#password', password);
    await this.submitButton.click();
  }
}
3. Prefferd Locators would use inside the pageobject classes,
  .getbyLabel,getbyText,getbyRole,getByplaceHolder.
  .If no option then use CSS/Xpath.

4. Naming Standards:
  .Class names must be use PascalCase.
  .Methods names must be meaningful and action-oriented.
  .Variables name must be use camelCase.
5. Use POM in the test files:
What all are the classes needed for the test import those.Create object pass page an argument for the class and call related methods to the test.
Example:
import { LoginPage } from '../PageObjects/LoginPage';
test('User Login', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await page.goto('/login');
  await loginPage.login('admin@test.com', 'password');
});
6. Don't use any locators directly in the test file.

❌ Avoid:

await page.locator('#email').fill('admin@test.com');
await page.locator('#password').fill('password');
await page.locator('#submit').click();
✅ Preferred:

await loginPage.login(
    'admin@test.com',
    'password'
);

7. Wait mechanism use as much as possible:
  .await page.waitforURL(),await page.waitforResponse(),waitfor().
