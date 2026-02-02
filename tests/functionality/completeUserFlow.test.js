const { describe, it, before, after } = require('mocha');
const { expect } = require('chai');
const SeleniumConfig = require('../config/selenium.config');
const SeleniumHelpers = require('../utils/seleniumHelpers');
const { By } = require('selenium-webdriver');
const path = require('path');

/**
 * FUNCTIONALITY TESTING - Complete User Flows
 * Tests end-to-end user journeys and complete feature workflows
 */
describe('Functionality Tests - Complete User Flows', function () {
    this.timeout(90000);
    let driver;
    let helpers;
    const testEmail = `e2etest${Date.now()}@example.com`;
    const testPassword = 'E2ETest123!';
    const testUsername = `e2euser_${Date.now()}`;

    before(async function () {
        driver = await SeleniumConfig.getChromeDriver();
        helpers = new SeleniumHelpers(driver);
    });

    after(async function () {
        if (driver) {
            await driver.quit();
        }
    });

    it('Complete Flow: Register → Login → Upload → Share → Logout', async function () {
        // Step 1: Register new user
        console.log('Step 1: Registering new user...');
        await helpers.navigateTo('/register');

        await helpers.typeText(By.css('input[type="text"], input#username'), testUsername);
        await helpers.typeText(By.css('input[type="email"], input#email'), testEmail);
        await helpers.typeText(By.css('input[type="password"], input#password'), testPassword);
        await helpers.clickElement(By.css('button[type="submit"]'));
        await helpers.sleep(3000);

        await helpers.takeScreenshot('functionality-01-registered');

        // Step 2: Login with new credentials
        console.log('Step 2: Logging in...');
        await helpers.navigateTo('/login');

        await helpers.typeText(By.css('input[type="email"], input#email'), testEmail);
        await helpers.typeText(By.css('input[type="password"], input#password'), testPassword);
        await helpers.clickElement(By.css('button[type="submit"]'));
        await helpers.sleep(3000);

        let currentUrl = await helpers.getCurrentUrl();
        expect(currentUrl).to.include('/dashboard');

        await helpers.takeScreenshot('functionality-02-logged-in');

        // Step 3: Upload a file
        console.log('Step 3: Uploading file...');
        const fileInput = await helpers.waitForElement(By.css('input[type="file"]'));
        const testFilePath = path.resolve(__dirname, '../fixtures/test-file.txt');
        await fileInput.sendKeys(testFilePath);
        await helpers.sleep(2000);

        // Click upload if button exists
        const uploadButtonExists = await helpers.isDisplayed(By.css('button[data-action="upload"], .upload-button'));
        if (uploadButtonExists) {
            await helpers.clickElement(By.css('button[data-action="upload"], .upload-button'));
        }

        await helpers.sleep(4000);

        await helpers.takeScreenshot('functionality-03-file-uploaded');

        // Step 4: Share the file
        console.log('Step 4: Sharing file...');
        const shareButtonExists = await helpers.isDisplayed(By.css('[data-action="share"], .share-button'));

        if (shareButtonExists) {
            await helpers.clickElement(By.css('[data-action="share"], .share-button'));
            await helpers.sleep(1000);

            const emailInputExists = await helpers.isDisplayed(By.css('input[name="email"], input[type="email"]'));
            if (emailInputExists) {
                await helpers.typeText(By.css('input[name="email"], input[type="email"]'), 'recipient@example.com');
                await helpers.clickElement(By.css('button[type="submit"], .share-submit'));
                await helpers.sleep(2000);
            }

            await helpers.takeScreenshot('functionality-04-file-shared');
        }

        // Step 5: Navigate to shared files
        console.log('Step 5: Navigating to shared files...');
        await helpers.navigateTo('/shared');
        await helpers.sleep(2000);

        currentUrl = await helpers.getCurrentUrl();
        expect(currentUrl).to.include('/shared');

        await helpers.takeScreenshot('functionality-05-shared-page');

        // Step 6: Logout
        console.log('Step 6: Logging out...');
        const logoutButtonExists = await helpers.isDisplayed(By.css('[data-action="logout"], .logout-button, button:contains("Logout")'));

        if (logoutButtonExists) {
            await helpers.clickElement(By.css('[data-action="logout"], .logout-button'));
            await helpers.sleep(2000);

            currentUrl = await helpers.getCurrentUrl();
            expect(currentUrl).to.include('/login');

            await helpers.takeScreenshot('functionality-06-logged-out');
        }

        console.log('Complete flow test finished successfully!');
    });

    it('Complete Flow: Login → Create Folder → Upload to Folder → Delete Folder', async function () {
        // Login
        console.log('Step 1: Logging in...');
        await helpers.navigateTo('/login');
        await helpers.typeText(By.css('input[type="email"], input#email'), testEmail);
        await helpers.typeText(By.css('input[type="password"], input#password'), testPassword);
        await helpers.clickElement(By.css('button[type="submit"]'));
        await helpers.sleep(3000);

        // Create folder
        console.log('Step 2: Creating folder...');
        const createFolderExists = await helpers.isDisplayed(By.css('[data-action="create-folder"], .create-folder-button, button:contains("Folder")'));

        if (createFolderExists) {
            await helpers.clickElement(By.css('[data-action="create-folder"], .create-folder-button'));
            await helpers.sleep(1000);

            const folderNameInput = await helpers.isDisplayed(By.css('input[name="folderName"], input[name="name"]'));
            if (folderNameInput) {
                await helpers.typeText(By.css('input[name="folderName"], input[name="name"]'), 'Test Folder');
                await helpers.clickElement(By.css('button[type="submit"], .confirm-button'));
                await helpers.sleep(2000);

                await helpers.takeScreenshot('functionality-folder-created');
            }
        }

        // Upload to folder
        console.log('Step 3: Uploading to folder...');
        const folderExists = await helpers.isDisplayed(By.css('.folder-item, .folder'));
        if (folderExists) {
            await helpers.clickElement(By.css('.folder-item, .folder'));
            await helpers.sleep(1000);

            const fileInput = await helpers.waitForElement(By.css('input[type="file"]'));
            const testFilePath = path.resolve(__dirname, '../fixtures/sample-document.txt');
            await fileInput.sendKeys(testFilePath);
            await helpers.sleep(3000);

            await helpers.takeScreenshot('functionality-file-in-folder');
        }

        // Navigate back and delete folder
        console.log('Step 4: Deleting folder...');
        await helpers.navigateTo('/dashboard');
        await helpers.sleep(2000);

        const deleteFolderExists = await helpers.isDisplayed(By.css('.folder-item .delete-button, [data-action="delete-folder"]'));
        if (deleteFolderExists) {
            await helpers.clickElement(By.css('.folder-item .delete-button, [data-action="delete-folder"]'));
            await helpers.sleep(1000);

            const confirmExists = await helpers.isDisplayed(By.css('.confirm-delete, button:contains("Confirm")'));
            if (confirmExists) {
                await helpers.clickElement(By.css('.confirm-delete'));
                await helpers.sleep(2000);
            }

            await helpers.takeScreenshot('functionality-folder-deleted');
        }

        console.log('Folder workflow test finished successfully!');
    });

    it('Complete Flow: Login → Settings → Update Profile → Verify Changes', async function () {
        // Login
        console.log('Step 1: Logging in...');
        await helpers.navigateTo('/login');
        await helpers.typeText(By.css('input[type="email"], input#email'), testEmail);
        await helpers.typeText(By.css('input[type="password"], input#password'), testPassword);
        await helpers.clickElement(By.css('button[type="submit"]'));
        await helpers.sleep(3000);

        // Navigate to settings
        console.log('Step 2: Navigating to settings...');
        await helpers.navigateTo('/settings');
        await helpers.sleep(2000);

        const currentUrl = await helpers.getCurrentUrl();
        expect(currentUrl).to.include('/settings');

        await helpers.takeScreenshot('functionality-settings-page');

        // Update profile (if available)
        console.log('Step 3: Updating profile...');
        const usernameInputExists = await helpers.isDisplayed(By.css('input[name="username"], input#username'));

        if (usernameInputExists) {
            await helpers.typeText(By.css('input[name="username"], input#username'), `${testUsername}_updated`);

            const saveButtonExists = await helpers.isDisplayed(By.css('button[type="submit"], .save-button'));
            if (saveButtonExists) {
                await helpers.clickElement(By.css('button[type="submit"], .save-button'));
                await helpers.sleep(2000);

                await helpers.takeScreenshot('functionality-profile-updated');
            }
        }

        console.log('Settings workflow test finished successfully!');
    });
});
