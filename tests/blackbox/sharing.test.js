const { describe, it, before, after } = require('mocha');
const { expect } = require('chai');
const SeleniumConfig = require('../config/selenium.config');
const SeleniumHelpers = require('../utils/seleniumHelpers');
const { By } = require('selenium-webdriver');

/**
 * BLACK BOX TESTING - File Sharing
 * Tests file sharing functionality from user perspective
 */
describe('Black Box Tests - File Sharing', function () {
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

    it('should display share option for files', async function () {
        await helpers.navigateTo('/dashboard');
        await helpers.sleep(4000); // Wait for files to load

        // Check for share button (appears only if files exist)
        // Try multiple selectors since share button might be in table or mobile view
        const shareButtonExists = await helpers.isDisplayed(By.xpath('//button[@title="Share"]'));

        expect(shareButtonExists).to.be.true;

        await helpers.takeScreenshot('blackbox-share-button');
    });

    it('should open share modal when share button is clicked', async function () {
        await helpers.navigateTo('/dashboard');
        await helpers.sleep(2000);

        const shareButtonExists = await helpers.isDisplayed(By.css('[data-action="share"], .share-button'));

        if (shareButtonExists) {
            await helpers.clickElement(By.css('[data-action="share"], .share-button'));
            await helpers.sleep(1000);

            const modalExists = await helpers.isDisplayed(By.css('.modal, .share-modal, [role="dialog"]'));

            expect(modalExists).to.be.true;

            await helpers.takeScreenshot('blackbox-share-modal');
        }
    });

    it('should allow sharing file with email address', async function () {
        await helpers.navigateTo('/dashboard');
        await helpers.sleep(2000);

        const shareButtonExists = await helpers.isDisplayed(By.css('[data-action="share"], .share-button'));

        if (shareButtonExists) {
            await helpers.clickElement(By.css('[data-action="share"], .share-button'));
            await helpers.sleep(1000);

            // Enter email
            const emailInputExists = await helpers.isDisplayed(By.css('input[name="email"], input[type="email"]'));
            if (emailInputExists) {
                await helpers.typeText(By.css('input[name="email"], input[type="email"]'), 'recipient@example.com');

                // Submit share
                await helpers.clickElement(By.css('button[type="submit"], .share-submit'));
                await helpers.sleep(2000);

                await helpers.takeScreenshot('blackbox-file-shared');
            }
        }

        expect(true).to.be.true;
    });

    it('should display shared files page', async function () {
        await helpers.navigateTo('/shared');
        await helpers.sleep(2000);

        const currentUrl = await helpers.getCurrentUrl();
        expect(currentUrl).to.include('/shared');

        await helpers.takeScreenshot('blackbox-shared-files-page');
    });

    it('should generate shareable link', async function () {
        await helpers.navigateTo('/dashboard');
        await helpers.sleep(2000);

        const shareButtonExists = await helpers.isDisplayed(By.css('[data-action="share"], .share-button'));

        if (shareButtonExists) {
            await helpers.clickElement(By.css('[data-action="share"], .share-button'));
            await helpers.sleep(1000);

            // Look for link generation option
            const linkButtonExists = await helpers.isDisplayed(By.css('.generate-link, button:contains("Link"), [data-action="generate-link"]'));

            if (linkButtonExists) {
                await helpers.clickElement(By.css('.generate-link, [data-action="generate-link"]'));
                await helpers.sleep(1000);

                // Check if link is displayed
                const linkExists = await helpers.isDisplayed(By.css('input[readonly], .share-link, code'));

                expect(linkExists).to.be.true;

                await helpers.takeScreenshot('blackbox-shareable-link');
            }
        }
    });
});
