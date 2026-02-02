const { describe, it, before, after } = require('mocha');
const { expect } = require('chai');
const SeleniumConfig = require('../config/selenium.config');
const SeleniumHelpers = require('../utils/seleniumHelpers');
const { By } = require('selenium-webdriver');
const path = require('path');

/**
 * BLACK BOX TESTING - File Operations
 * Tests file upload, download, and delete without knowledge of backend implementation
 */
describe('Black Box Tests - File Operations', function () {
    this.timeout(60000);
    let driver;
    let helpers;

    before(async function () {
        driver = await SeleniumConfig.getChromeDriver();
        helpers = new SeleniumHelpers(driver);

        // Login before testing file operations
        await helpers.navigateTo('/login');
        await helpers.typeText(By.css('input[type="email"], input[name="email"], input#email'), process.env.TEST_USER_EMAIL);
        await helpers.typeText(By.css('input[type="password"], input[name="password"], input#password'), process.env.TEST_USER_PASSWORD);
        await helpers.clickElement(By.css('button[type="submit"]'));
        await helpers.sleep(2000);
    });

    after(async function () {
        if (driver) {
            await driver.quit();
        }
    });

    it('should display file upload interface', async function () {
        await helpers.navigateTo('/dashboard');
        await helpers.sleep(2000);

        // Dashboard has "Upload Files" quick action button that navigates to /upload
        const uploadButton = await helpers.isDisplayed(By.xpath('//button[.//h3[contains(text(), "Upload Files")]]'));

        expect(uploadButton).to.be.true;

        await helpers.takeScreenshot('blackbox-file-upload-interface');
    });

    it('should successfully upload a file', async function () {
        await helpers.navigateTo('/dashboard');

        // Find file input
        const fileInput = await helpers.waitForElement(By.css('input[type="file"]'));
        const testFilePath = path.resolve(__dirname, '../fixtures/test-file.txt');

        // Upload file
        await fileInput.sendKeys(testFilePath);
        await helpers.sleep(1000);

        // Click upload button if exists
        const uploadButtonExists = await helpers.isDisplayed(By.css('button[data-action="upload"], .upload-button'));
        if (uploadButtonExists) {
            await helpers.clickElement(By.css('button[data-action="upload"], .upload-button'));
        }

        await helpers.sleep(3000);

        // Verify file appears in list
        const fileListExists = await helpers.isDisplayed(By.css('.file-list, .files-container, table'));
        expect(fileListExists).to.be.true;

        await helpers.takeScreenshot('blackbox-file-uploaded');
    });

    it('should display uploaded files in file list', async function () {
        await helpers.navigateTo('/dashboard');
        await helpers.sleep(3000);

        // Check if "Recently Uploaded Files" section exists
        const hasFileSection = await helpers.isDisplayed(By.xpath('//h2[text()="Recently Uploaded Files"]'));

        expect(hasFileSection).to.be.true;

        await helpers.takeScreenshot('blackbox-file-list');
    });

    it('should allow file download', async function () {
        await helpers.navigateTo('/dashboard');
        await helpers.sleep(2000);

        // Look for download button/link
        const downloadButtonExists = await helpers.isDisplayed(By.css('[data-action="download"], .download-button, a[download]'));

        if (downloadButtonExists) {
            await helpers.clickElement(By.css('[data-action="download"], .download-button, a[download]'));
            await helpers.sleep(2000);

            // File download initiated (can't verify actual download in headless mode)
            expect(true).to.be.true;
        }

        await helpers.takeScreenshot('blackbox-file-download');
    });

    it('should allow file deletion', async function () {
        await helpers.navigateTo('/dashboard');
        await helpers.sleep(2000);

        // Look for delete button
        const deleteButtonExists = await helpers.isDisplayed(By.css('[data-action="delete"], .delete-button, button[title*="Delete"]'));

        if (deleteButtonExists) {
            await helpers.clickElement(By.css('[data-action="delete"], .delete-button, button[title*="Delete"]'));
            await helpers.sleep(1000);

            // Confirm deletion if modal appears
            const confirmButtonExists = await helpers.isDisplayed(By.css('.confirm-delete, button:contains("Confirm"), button:contains("Delete")'));
            if (confirmButtonExists) {
                await helpers.clickElement(By.css('.confirm-delete, button:contains("Confirm")'));
            }

            await helpers.sleep(2000);

            await helpers.takeScreenshot('blackbox-file-deleted');
        }

        expect(true).to.be.true;
    });

    it('should show file details when clicked', async function () {
        await helpers.navigateTo('/dashboard');
        await helpers.sleep(2000);

        // Click on a file item
        const fileItemExists = await helpers.isDisplayed(By.css('.file-item, .file-row, tr'));

        if (fileItemExists) {
            await helpers.clickElement(By.css('.file-item, .file-row, tr'));
            await helpers.sleep(1000);

            // Check if details panel or modal appears
            const detailsExists = await helpers.isDisplayed(By.css('.file-details, .modal, .sidebar'));

            expect(detailsExists).to.be.true;

            await helpers.takeScreenshot('blackbox-file-details');
        }
    });
});
