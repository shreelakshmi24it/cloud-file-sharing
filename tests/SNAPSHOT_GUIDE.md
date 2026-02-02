# Snapshot Testing Guide

## 📸 Snapshot Capabilities for All 5 Test Types

Every test type now captures snapshots for documentation and debugging!

---

## 1. Unit Tests (Jest Snapshots)

**Type**: JSON snapshots of function outputs

**Location**: `tests/unit/backend/__snapshots__/`

**Usage**:
```typescript
it('should match snapshot', () => {
    const result = myFunction(input);
    expect(result).toMatchSnapshot();
});
```

**Update snapshots**:
```bash
cd backend
npm run test:unit -- -u
```

---

## 2. White Box Tests (JSON Snapshots)

**Type**: JSON snapshots of internal states, validation results, algorithm outputs

**Location**: `tests/snapshots/whitebox/`

**Features**:
- Password validation results
- Token generation data
- Authentication state changes (before/after)
- Algorithm execution data

**Example**:
```javascript
const snapshot = new SnapshotUtil('whitebox');
snapshot.saveSnapshot('password-validation', validationResults);
snapshot.saveComparison('auth-flow', beforeState, afterState);
```

**Run**:
```bash
cd tests
npm run test:whitebox
# Check: tests/snapshots/whitebox/*.json
```

---

## 3. Black Box Tests (Screenshots)

**Type**: PNG screenshots of UI at every step

**Location**: `tests/screenshots/`

**Auto-captured at**:
- Form displays
- Each input field filled
- Button clicks
- Success/error states
- Page transitions

**Enhanced screenshots**:
- `blackbox-registration-form.png`
- `blackbox-registration-step1-username.png`
- `blackbox-registration-step2-email.png`
- `blackbox-registration-step3-password.png`
- `blackbox-registration-step4-submit.png`
- `blackbox-registration-success.png`

**Run**:
```bash
cd tests
npm run test:blackbox
# Check: tests/screenshots/*.png
```

---

## 4. Integration Tests (JSON + API Snapshots)

**Type**: JSON snapshots of API responses, database states, service interactions

**Location**: `tests/snapshots/integration/`

**Captures**:
- API request/response pairs
- Database state before/after operations
- S3 upload/download data
- Service integration results

**Example**:
```javascript
const snapshot = new SnapshotUtil('integration');
snapshot.saveApiResponse('/api/auth/login', response);
snapshot.saveDatabaseSnapshot('user-creation', dbData);
snapshot.saveComparison('storage-quota', before, after);
```

**Run**:
```bash
cd tests
npm run test:integration
# Check: tests/snapshots/integration/*.json
```

---

## 5. Functionality Tests (Screenshots + Flow Data)

**Type**: Screenshots of complete user flows + JSON flow data

**Location**: 
- Screenshots: `tests/screenshots/`
- Flow data: `tests/snapshots/functionality/`

**Captures**:
- Every step of user journey (screenshots)
- Flow completion data (JSON)
- Performance metrics
- User interaction timeline

**Run**:
```bash
cd tests
npm run test:functionality
# Check: tests/screenshots/*.png
# Check: tests/snapshots/functionality/*.json
```

---

## 📊 Snapshot Directory Structure

```
tests/
├── screenshots/              # Selenium screenshots (Black Box & Functionality)
│   ├── blackbox-*.png
│   ├── functionality-*.png
│   └── ...
├── snapshots/               # JSON snapshots
│   ├── whitebox/           # White Box test data
│   │   ├── password-validation_*.json
│   │   ├── auth-flow_*.json
│   │   └── ...
│   ├── integration/        # Integration test data
│   │   ├── api_auth_register_*.json
│   │   ├── db_user-creation_*.json
│   │   └── ...
│   └── functionality/      # Functionality test data
│       ├── complete-flow_*.json
│       └── ...
└── unit/backend/__snapshots__/  # Jest snapshots
    ├── authController.test.ts.snap
    └── fileController.test.ts.snap
```

---

## 🎯 Viewing Snapshots

### View Screenshots
```bash
cd /home/aditya/Desktop/programming/cloud-file-sharing/tests/screenshots
eog *.png  # or your image viewer
```

### View JSON Snapshots
```bash
cd /home/aditya/Desktop/programming/cloud-file-sharing/tests/snapshots

# View white box snapshots
cat whitebox/*.json | jq .

# View integration snapshots
cat integration/*.json | jq .

# View functionality snapshots
cat functionality/*.json | jq .
```

### View HTML Report
```bash
cd /home/aditya/Desktop/programming/cloud-file-sharing/tests
xdg-open mochawesome-report/mochawesome.html
```

---

## 🔧 Snapshot Utilities

### SnapshotUtil Class

**Methods**:
- `saveSnapshot(name, data)` - Save any JSON data
- `saveTestResult(testName, result)` - Save test execution results
- `saveApiResponse(endpoint, response)` - Save API responses
- `saveDatabaseSnapshot(operation, data)` - Save database states
- `saveComparison(name, before, after)` - Save before/after comparisons
- `cleanOldSnapshots(keepLast)` - Clean old snapshots

**Example**:
```javascript
const SnapshotUtil = require('./utils/snapshotUtil');
const snapshot = new SnapshotUtil('my-test-type');

// Save any data
snapshot.saveSnapshot('test-data', { foo: 'bar' });

// Save API response
snapshot.saveApiResponse('/api/users', apiResponse);

// Save before/after comparison
snapshot.saveComparison('user-update', beforeData, afterData);

// Clean old snapshots (keep last 10)
snapshot.cleanOldSnapshots(10);
```

---

## 📈 Snapshot Benefits

### Documentation
- Visual proof of test execution
- Historical record of test states
- Easy debugging with screenshots

### Debugging
- See exactly what happened during test
- Compare before/after states
- Identify UI issues visually

### Regression Testing
- Compare current vs previous snapshots
- Detect unexpected changes
- Validate API contract compliance

### Reporting
- Include screenshots in test reports
- Show stakeholders actual test execution
- Demonstrate test coverage visually

---

## 🚀 Quick Commands

```bash
# Run all tests and generate all snapshots
cd tests
npm run test:all

# View all screenshots
eog screenshots/*.png

# View all JSON snapshots
find snapshots -name "*.json" -exec cat {} \; | jq .

# Clean old snapshots
node -e "const S = require('./utils/snapshotUtil'); new S('whitebox').cleanOldSnapshots(5);"

# Count snapshots
echo "Screenshots: $(ls screenshots/*.png 2>/dev/null | wc -l)"
echo "JSON Snapshots: $(find snapshots -name '*.json' 2>/dev/null | wc -l)"
```

---

## ✨ What's Captured

| Test Type | Screenshots | JSON Data | HTML Report |
|-----------|-------------|-----------|-------------|
| Unit | ❌ | ✅ (Jest) | ✅ |
| White Box | ❌ | ✅ | ✅ |
| Black Box | ✅ | ❌ | ✅ |
| Integration | ❌ | ✅ | ✅ |
| Functionality | ✅ | ✅ | ✅ |

**Total Snapshot Types**: 3 (Screenshots, JSON, HTML Reports)

---

## 🎉 Summary

✅ **Screenshots** for all Selenium tests (Black Box & Functionality)  
✅ **JSON snapshots** for all logic tests (Unit, White Box, Integration)  
✅ **HTML reports** for all test types  
✅ **Before/after comparisons** for state changes  
✅ **API response snapshots** for integration tests  
✅ **Automatic cleanup** to manage snapshot storage  

Every test now creates visual or data evidence of execution!
