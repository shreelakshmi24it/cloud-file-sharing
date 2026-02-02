const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
require('dotenv').config({ path: '.env.test' });

/**
 * Selenium WebDriver Configuration
 * Provides methods to create browser instances for testing
 */
class SeleniumConfig {
    /**
     * Get Chrome/Chromium WebDriver instance
     * Simplified configuration for better compatibility
     * @returns {Promise<WebDriver>}
     */
    static async getChromeDriver() {
        const options = new chrome.Options();

        // Don't set binary path - let ChromeDriver find it automatically
        // This works better with snap installations

        if (process.env.HEADLESS === 'true') {
            options.addArguments('--headless=new');
        }

        // Essential arguments only
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        options.addArguments('--disable-gpu');
        options.addArguments(`--window-size=${process.env.WINDOW_WIDTH || 1920},${process.env.WINDOW_HEIGHT || 1080}`);

        try {
            console.log('🔧 Creating Chrome driver...');
            const driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(options)
                .build();
            console.log('✅ Chrome driver created successfully');
            return driver;
        } catch (error) {
            console.error('❌ Failed to create Chrome driver:', error.message);
            throw error;
        }
    }

    /**
     * Get Firefox WebDriver instance
     * @returns {Promise<WebDriver>}
     */
    static async getFirefoxDriver() {
        const options = new firefox.Options();

        if (process.env.HEADLESS === 'true') {
            options.addArguments('-headless');
        }

        options.addArguments(`--width=${process.env.WINDOW_WIDTH || 1920}`);
        options.addArguments(`--height=${process.env.WINDOW_HEIGHT || 1080}`);

        return await new Builder()
            .forBrowser('firefox')
            .setFirefoxOptions(options)
            .build();
    }

    /**
     * Get default browser driver based on environment
     * @returns {Promise<WebDriver>}
     */
    static async getDefaultDriver() {
        const browser = process.env.DEFAULT_BROWSER || 'chrome';

        switch (browser.toLowerCase()) {
            case 'firefox':
                return await this.getFirefoxDriver();
            case 'chrome':
            case 'chromium':
            default:
                return await this.getChromeDriver();
        }
    }
}

module.exports = SeleniumConfig;
