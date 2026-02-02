const { By, until, Key } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.test' });

/**
 * Selenium Test Helper Utilities
 * Provides common methods for interacting with web elements
 */
class SeleniumHelpers {
    constructor(driver) {
        this.driver = driver;
        this.baseUrl = process.env.TEST_BASE_URL || 'http://localhost:5173';
        this.timeout = parseInt(process.env.DEFAULT_TIMEOUT) || 10000;
    }

    /**
     * Navigate to a specific path
     * @param {string} path - Path to navigate to (e.g., '/login')
     */
    async navigateTo(path = '/') {
        await this.driver.get(`${this.baseUrl}${path}`);
        await this.driver.sleep(500); // Wait for page to stabilize
    }

    /**
     * Wait for an element to be located
     * @param {By} locator - Element locator
     * @param {number} timeout - Custom timeout (optional)
     * @returns {Promise<WebElement>}
     */
    async waitForElement(locator, timeout = this.timeout) {
        return await this.driver.wait(until.elementLocated(locator), timeout);
    }

    /**
     * Wait for an element to be visible
     * @param {By} locator - Element locator
     * @param {number} timeout - Custom timeout (optional)
     * @returns {Promise<WebElement>}
     */
    async waitForVisible(locator, timeout = this.timeout) {
        const element = await this.waitForElement(locator, timeout);
        await this.driver.wait(until.elementIsVisible(element), timeout);
        return element;
    }

    /**
     * Click an element
     * @param {By} locator - Element locator
     */
    async clickElement(locator) {
        const element = await this.waitForVisible(locator);
        await element.click();
    }

    /**
     * Type text into an input field
     * @param {By} locator - Element locator
     * @param {string} text - Text to type
     * @param {boolean} clearFirst - Whether to clear the field first
     */
    async typeText(locator, text, clearFirst = true) {
        const element = await this.waitForVisible(locator);
        if (clearFirst) {
            await element.clear();
        }
        await element.sendKeys(text);
    }

    /**
     * Get text from an element
     * @param {By} locator - Element locator
     * @returns {Promise<string>}
     */
    async getText(locator) {
        const element = await this.waitForElement(locator);
        return await element.getText();
    }

    /**
     * Get attribute value from an element
     * @param {By} locator - Element locator
     * @param {string} attribute - Attribute name
     * @returns {Promise<string>}
     */
    async getAttribute(locator, attribute) {
        const element = await this.waitForElement(locator);
        return await element.getAttribute(attribute);
    }

    /**
     * Check if element is displayed
     * @param {By} locator - Element locator
     * @returns {Promise<boolean>}
     */
    async isDisplayed(locator) {
        try {
            const element = await this.waitForElement(locator, 5000);
            return await element.isDisplayed();
        } catch (error) {
            return false;
        }
    }

    /**
     * Check if element is enabled
     * @param {By} locator - Element locator
     * @returns {Promise<boolean>}
     */
    async isEnabled(locator) {
        const element = await this.waitForElement(locator);
        return await element.isEnabled();
    }

    /**
     * Wait for URL to contain a specific string
     * @param {string} urlPart - Part of URL to wait for
     * @param {number} timeout - Custom timeout (optional)
     */
    async waitForUrlContains(urlPart, timeout = this.timeout) {
        await this.driver.wait(until.urlContains(urlPart), timeout);
    }

    /**
     * Get current URL
     * @returns {Promise<string>}
     */
    async getCurrentUrl() {
        return await this.driver.getCurrentUrl();
    }

    /**
     * Get page title
     * @returns {Promise<string>}
     */
    async getTitle() {
        return await this.driver.getTitle();
    }

    /**
     * Take a screenshot
     * @param {string} filename - Filename without extension
     */
    async takeScreenshot(filename) {
        const screenshotDir = path.join(__dirname, '../screenshots');

        // Create directory if it doesn't exist
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }

        const screenshot = await this.driver.takeScreenshot();
        const filepath = path.join(screenshotDir, `${filename}.png`);
        fs.writeFileSync(filepath, screenshot, 'base64');

        console.log(`Screenshot saved: ${filepath}`);
    }

    /**
     * Scroll to an element
     * @param {By} locator - Element locator
     */
    async scrollToElement(locator) {
        const element = await this.waitForElement(locator);
        await this.driver.executeScript('arguments[0].scrollIntoView(true);', element);
        await this.driver.sleep(300);
    }

    /**
     * Select dropdown option by visible text
     * @param {By} locator - Select element locator
     * @param {string} text - Option text
     */
    async selectByText(locator, text) {
        const element = await this.waitForElement(locator);
        const options = await element.findElements(By.tagName('option'));

        for (let option of options) {
            const optionText = await option.getText();
            if (optionText === text) {
                await option.click();
                return;
            }
        }

        throw new Error(`Option with text "${text}" not found`);
    }

    /**
     * Upload a file
     * @param {By} locator - File input locator
     * @param {string} filepath - Absolute path to file
     */
    async uploadFile(locator, filepath) {
        const element = await this.waitForElement(locator);
        await element.sendKeys(filepath);
    }

    /**
     * Execute JavaScript
     * @param {string} script - JavaScript code
     * @param {...any} args - Arguments to pass to script
     * @returns {Promise<any>}
     */
    async executeScript(script, ...args) {
        return await this.driver.executeScript(script, ...args);
    }

    /**
     * Wait for a specific amount of time
     * @param {number} ms - Milliseconds to wait
     */
    async sleep(ms) {
        await this.driver.sleep(ms);
    }

    /**
     * Switch to an iframe
     * @param {By} locator - Iframe locator
     */
    async switchToIframe(locator) {
        const iframe = await this.waitForElement(locator);
        await this.driver.switchTo().frame(iframe);
    }

    /**
     * Switch back to default content
     */
    async switchToDefaultContent() {
        await this.driver.switchTo().defaultContent();
    }

    /**
     * Accept alert
     */
    async acceptAlert() {
        await this.driver.wait(until.alertIsPresent(), this.timeout);
        const alert = await this.driver.switchTo().alert();
        await alert.accept();
    }

    /**
     * Dismiss alert
     */
    async dismissAlert() {
        await this.driver.wait(until.alertIsPresent(), this.timeout);
        const alert = await this.driver.switchTo().alert();
        await alert.dismiss();
    }

    /**
     * Get alert text
     * @returns {Promise<string>}
     */
    async getAlertText() {
        await this.driver.wait(until.alertIsPresent(), this.timeout);
        const alert = await this.driver.switchTo().alert();
        return await alert.getText();
    }
}

module.exports = SeleniumHelpers;
