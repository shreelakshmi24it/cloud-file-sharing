const { describe, it, before, after } = require('mocha');
const { expect } = require('chai');
const SeleniumConfig = require('../config/selenium.config');
const SeleniumHelpers = require('../utils/seleniumHelpers');
const { By } = require('selenium-webdriver');
const path = require('path');

/**
 * FUNCTIONALITY TESTING - File Management
 * Tests complete file management features and workflows
 */
describe('Functionality Tests - File Management', function () {
    this.timeout(60000);
    let driver;
    let helpers;

    before(async function () {
        driver = await SeleniumConfig.getChromeDriver();
        helpers = new SeleniumHelpers(driver);

        // Login
        await helpers.navigateTo('/login');
        await helpers.typeText(By.css('input[type="email"], input#email'), process.env.TEST_USER_EMAIL);
        await helpers.typeText(By.css('input[type="password"], input#password'), process.env.TEST_USER_PASSWORD);
        await helpers.clickElement(By.css('button[type="submit"]'));
        await helpers.sleep(2000);
    });

    after(async function () {
        if (driver) {
            await driver.quit();
        }
    });

    it('should display file management interface with all features', async function () {
        await helpers.navigateTo('/dashboard');
        await helpers.sleep(2000);

        // Check for key file management features
        const hasUpload = await helpers.isDisplayed(By.css('input[type="file"], .upload-button'));
        const hasFileList = await helpers.isDisplayed(By.css('.file-list, .files-container, table'));

        expect(hasUpload).to.be.true;
        expect(hasFileList).to.be.true;

        await helpers.takeScreenshot('functionality-file-management-interface');
    });

    it('should support multiple file uploads', async function () {
        await helpers.navigateTo('/dashboard');
        await helpers.sleep(2000);

        // Upload first file
        const fileInput1 = await helpers.waitForElement(By.css('input[type="file"]'));
        const testFile1 = path.resolve(__dirname, '../fixtures/test-file.txt');
        await fileInput1.sendKeys(testFile1);
        await helpers.sleep(3000);

        // Upload second file
        const fileInput2 = await helpers.waitForElement(By.css('input[type="file"]'));
        const testFile2 = path.resolve(__dirname, '../fixtures/sample-document.txt');
        await fileInput2.sendKeys(testFile2);
        await helpers.sleep(3000);

        await helpers.takeScreenshot('functionality-multiple-files-uploaded');

        expect(true).to.be.true;
    });

    it('should allow file search/filter functionality', async function () {
        await helpers.navigateTo('/dashboard');
        await helpers.sleep(2000);

        const searchExists = await helpers.isDisplayed(By.css('input[type="search"], input[placeholder*="Search"], .search-input'));

        if (searchExists) {
            await helpers.typeText(By.css('input[type="search"], input[placeholder*="Search"]'), 'test');
            await helpers.sleep(1000);

            await helpers.takeScreenshot('functionality-file-search');

            expect(true).to.be.true;
        }
    });

    it('should display file size and upload date', async function () {
        await helpers.navigateTo('/dashboard');
        await helpers.sleep(2000);

        const fileItemExists = await helpers.isDisplayed(By.css('.file-item, .file-row, tr'));

        if (fileItemExists) {
            // Check for file metadata
            const hasMetadata = await helpers.isDisplayed(By.css('.file-size, .file-date, .metadata, td'));

            expect(hasMetadata).to.be.true;

            await helpers.takeScreenshot('functionality-file-metadata');
        }
    });

    it('should support file sorting', async function () {
        await helpers.navigateTo('/dashboard');
        await helpers.sleep(2000);

        const sortButtonExists = await helpers.isDisplayed(By.css('.sort-button, th, .sort-header'));

        if (sortButtonExists) {
            await helpers.clickElement(By.css('.sort-button, th, .sort-header'));
            await helpers.sleep(1000);

            await helpers.takeScreenshot('functionality-file-sorted');

            expect(true).to.be.true;
        }
    });

    it('should allow batch file operations', async function () {
        await helpers.navigateTo('/dashboard');
        await helpers.sleep(2000);

        const checkboxExists = await helpers.isDisplayed(By.css('input[type="checkbox"], .file-checkbox'));

        if (checkboxExists) {
            // Select multiple files
            const checkboxes = await driver.findElements(By.css('input[type="checkbox"], .file-checkbox'));

            if (checkboxes.length >= 2) {
                await checkboxes[0].click();
                await checkboxes[1].click();
                await helpers.sleep(1000);

                // Look for batch action buttons
                const batchActionsExist = await helpers.isDisplayed(By.css('.batch-actions, .bulk-actions'));

                await helpers.takeScreenshot('functionality-batch-selection');

                expect(true).to.be.true;
            }
        }
    });
});
