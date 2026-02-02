const { describe, it, before, after } = require('mocha');
const { expect } = require('chai');
const SeleniumConfig = require('../config/selenium.config');
const SeleniumHelpers = require('../utils/seleniumHelpers');
const { By } = require('selenium-webdriver');

/**
 * BLACK BOX TESTING - User Registration
 * Tests user registration functionality without knowledge of internal implementation
 * Focus: User-facing behavior and expected outcomes
 */
describe('Black Box Tests - User Registration', function () {
    this.timeout(60000);
    let driver;
    let helpers;

    before(async function () {
        driver = await SeleniumConfig.getChromeDriver();
        helpers = new SeleniumHelpers(driver);
    });

    after(async function () {
        if (driver) {
            await driver.quit();
        }
    });

    it('should display registration form with all required fields', async function () {
        await helpers.navigateTo('/register');

        // Verify all form fields are present (using actual IDs from RegisterPage.tsx)
        const nameField = await helpers.isDisplayed(By.css('input#name'));
        const emailField = await helpers.isDisplayed(By.css('input#email'));
        const passwordField = await helpers.isDisplayed(By.css('input#password'));
        const confirmPasswordField = await helpers.isDisplayed(By.css('input#confirmPassword'));
        const submitButton = await helpers.isDisplayed(By.css('button[type="submit"]'));

        expect(nameField).to.be.true;
        expect(emailField).to.be.true;
        expect(passwordField).to.be.true;
        expect(confirmPasswordField).to.be.true;
        expect(submitButton).to.be.true;

        await helpers.takeScreenshot('blackbox-registration-form');
    });

    it('should successfully register a new user with valid data', async function () {
        await helpers.navigateTo('/register');

        const timestamp = Date.now();
        const username = `testuser_${timestamp}`;
        const email = `test${timestamp}@example.com`;
        const password = 'TestPassword123!';

        // Fill registration form (using actual IDs)
        await helpers.typeText(By.css('input#name'), username);
        await helpers.typeText(By.css('input#email'), email);
        await helpers.typeText(By.css('input#password'), password);
        await helpers.typeText(By.css('input#confirmPassword'), password);

        // Agree to terms (required field)
        await helpers.clickElement(By.css('input#agreeToTerms'));

        // Submit form
        await helpers.clickElement(By.css('button[type="submit"]'));

        // Wait for navigation or success message
        await helpers.sleep(4000);

        // Verify redirect to login or dashboard
        const currentUrl = await helpers.getCurrentUrl();
        const isRedirected = currentUrl.includes('/login') || currentUrl.includes('/dashboard');

        expect(isRedirected).to.be.true;

        await helpers.takeScreenshot('blackbox-registration-success');
    });

    it('should show error for invalid email format', async function () {
        await helpers.navigateTo('/register');

        await helpers.typeText(By.css('input#name'), 'testuser');
        await helpers.typeText(By.css('input#email'), 'invalid-email');
        await helpers.typeText(By.css('input#password'), 'Password123!');
        await helpers.typeText(By.css('input#confirmPassword'), 'Password123!');

        // Agree to terms
        await helpers.clickElement(By.css('input#agreeToTerms'));

        await helpers.clickElement(By.css('button[type="submit"]'));
        await helpers.sleep(2000);

        // Check for error message (actual class from RegisterPage.tsx)
        const hasError = await helpers.isDisplayed(By.css('p.text-red-600'));

        expect(hasError).to.be.true;

        await helpers.takeScreenshot('blackbox-registration-invalid-email');
    });

    it('should show error for weak password', async function () {
        await helpers.navigateTo('/register');

        await helpers.typeText(By.css('input#name'), 'testuser');
        await helpers.typeText(By.css('input#email'), 'test@example.com');
        await helpers.typeText(By.css('input#password'), '123');
        await helpers.typeText(By.css('input#confirmPassword'), '123');

        await helpers.clickElement(By.css('button[type="submit"]'));
        await helpers.sleep(1000);

        const hasError = await helpers.isDisplayed(By.css('.text-red-600'));

        expect(hasError).to.be.true;

        await helpers.takeScreenshot('blackbox-registration-weak-password');
    });

    it('should prevent registration with duplicate email', async function () {
        await helpers.navigateTo('/register');

        // Use existing test user email
        await helpers.typeText(By.css('input#name'), 'newuser');
        await helpers.typeText(By.css('input#email'), process.env.TEST_USER_EMAIL);
        await helpers.typeText(By.css('input#password'), 'Password123!');
        await helpers.typeText(By.css('input#confirmPassword'), 'Password123!');

        await helpers.clickElement(By.css('button[type="submit"]'));
        await helpers.sleep(2000);

        // Should show error about existing email
        const hasError = await helpers.isDisplayed(By.css('.text-red-600, .bg-red-50'));

        expect(hasError).to.be.true;
    });
});
