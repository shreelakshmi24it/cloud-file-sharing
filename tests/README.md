# Testing Documentation

## Overview

This document provides comprehensive instructions for running all 5 types of tests in the cloud file-sharing application.

## Test Types

### 1. **Unit Testing**
Tests individual functions and components in isolation.

**Location**: `tests/unit/`

**Run Commands**:
```bash
# Backend unit tests
cd backend
npm run test:unit

# Frontend unit tests (when implemented)
cd frontend
npm run test:unit

# With coverage
npm run test:coverage
```

---

### 2. **White Box Testing**
Tests internal code structure, logic paths, and algorithms.

**Location**: `tests/whitebox/`

**Run Commands**:
```bash
cd tests
npm run test:whitebox
```

**Test Files**:
- `authLogic.test.js` - Authentication logic and validation
- `fileEncryption.test.js` - Encryption/decryption algorithms
- `databaseQueries.test.js` - Database query construction and validation

---

### 3. **Black Box Testing**
Tests functionality from user perspective using Selenium WebDriver.

**Location**: `tests/blackbox/`

**Run Commands**:
```bash
cd tests
npm run test:blackbox
```

**Test Files**:
- `userRegistration.test.js` - User registration flows
- `fileOperations.test.js` - File upload, download, delete
- `sharing.test.js` - File sharing features

---

### 4. **Integration Testing**
Tests interactions between modules and external services.

**Location**: `tests/integration/`

**Run Commands**:
```bash
cd tests
npm run test:integration
```

**Test Files**:
- `api/auth.integration.test.js` - Auth API with database
- `api/files.integration.test.js` - File API with S3 and database
- `services/s3.integration.test.js` - S3 storage service
- `database/models.integration.test.js` - Database models and relationships

---

### 5. **Functionality Testing**
Tests complete end-to-end user workflows.

**Location**: `tests/functionality/`

**Run Commands**:
```bash
cd tests
npm run test:functionality
```

**Test Files**:
- `completeUserFlow.test.js` - Complete user journeys
- `fileManagement.test.js` - File management features

---

## Setup Instructions

### 1. Install Dependencies

```bash
# Install test dependencies
cd tests
npm install

# Install backend dependencies (includes Jest)
cd ../backend
npm install
```

### 2. Configure Environment

Edit `tests/.env.test` with your configuration:

```env
TEST_BASE_URL=http://localhost:5173
TEST_API_URL=http://localhost:3000
TEST_USER_EMAIL=testuser@example.com
TEST_USER_PASSWORD=TestPassword123!
HEADLESS=true
```

### 3. Start Application

Before running tests, ensure your application is running:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## Running All Tests

```bash
# Run all test types
cd tests
npm run test:all

# Run specific test type
npm run test:unit
npm run test:whitebox
npm run test:blackbox
npm run test:integration
npm run test:functionality

# Run with coverage
npm run test:coverage
```

---

## Test Reports

After running tests, reports are generated in:

- **HTML Report**: `tests/mochawesome-report/mochawesome.html`
- **Coverage Report**: `backend/coverage/index.html`
- **Screenshots**: `tests/screenshots/`

To view HTML report:
```bash
# Linux
xdg-open tests/mochawesome-report/mochawesome.html

# macOS
open tests/mochawesome-report/mochawesome.html
```

---

## Writing New Tests

### Unit Test Example

```typescript
// tests/unit/backend/utils/myUtil.test.ts
describe('MyUtil', () => {
    it('should do something', () => {
        const result = myFunction(input);
        expect(result).toBe(expected);
    });
});
```

### Black Box Test Example

```javascript
// tests/blackbox/myFeature.test.js
const { describe, it, before, after } = require('mocha');
const { expect } = require('chai');
const SeleniumConfig = require('../config/selenium.config');
const SeleniumHelpers = require('../utils/seleniumHelpers');

describe('Black Box - My Feature', function() {
    let driver, helpers;

    before(async function() {
        driver = await SeleniumConfig.getChromeDriver();
        helpers = new SeleniumHelpers(driver);
    });

    after(async function() {
        await driver.quit();
    });

    it('should test feature', async function() {
        await helpers.navigateTo('/page');
        // Test logic here
    });
});
```

---

## Troubleshooting

### Selenium WebDriver Issues

If you encounter WebDriver errors:

```bash
# Update ChromeDriver
npm install --save-dev chromedriver@latest

# Run in non-headless mode for debugging
# Edit .env.test: HEADLESS=false
```

### Test Timeouts

Increase timeout in test file:
```javascript
describe('My Tests', function() {
    this.timeout(60000); // 60 seconds
    // tests...
});
```

### Database Connection Issues

Ensure PostgreSQL is running and credentials are correct in `.env` files.

---

## CI/CD Integration

To integrate with CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: |
    cd backend && npm run test:unit
    cd ../tests && npm install && npm run test:all
```

---

## Best Practices

1. **Keep tests independent** - Each test should be able to run in isolation
2. **Use descriptive names** - Test names should clearly describe what they test
3. **Clean up after tests** - Delete test data created during tests
4. **Mock external services** - Use mocks for S3, email services in unit tests
5. **Test edge cases** - Include tests for error conditions and boundary values
6. **Maintain test data** - Keep test fixtures up to date

---

## Test Coverage Goals

- **Unit Tests**: >80% code coverage
- **Integration Tests**: All API endpoints covered
- **Black Box Tests**: All user-facing features covered
- **Functionality Tests**: All critical user workflows covered
- **White Box Tests**: All complex logic paths covered

---

## Support

For issues or questions about testing:
1. Check test output and error messages
2. Review test documentation
3. Check application logs
4. Verify environment configuration
