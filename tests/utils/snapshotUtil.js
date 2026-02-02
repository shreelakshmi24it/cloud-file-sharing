const fs = require('fs');
const path = require('path');

/**
 * Snapshot Utility for Non-Selenium Tests
 * Captures JSON snapshots of test data, API responses, and test states
 */
class SnapshotUtil {
    constructor(testType = 'general') {
        this.testType = testType;
        this.snapshotDir = path.join(__dirname, '../snapshots', testType);
        this.ensureSnapshotDir();
    }

    /**
     * Ensure snapshot directory exists
     */
    ensureSnapshotDir() {
        if (!fs.existsSync(this.snapshotDir)) {
            fs.mkdirSync(this.snapshotDir, { recursive: true });
        }
    }

    /**
     * Save JSON snapshot
     * @param {string} name - Snapshot name
     * @param {any} data - Data to snapshot
     */
    saveSnapshot(name, data) {
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const filename = `${name}_${timestamp}.json`;
        const filepath = path.join(this.snapshotDir, filename);

        const snapshot = {
            testType: this.testType,
            name: name,
            timestamp: new Date().toISOString(),
            data: data
        };

        fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2));
        console.log(`📸 Snapshot saved: ${filename}`);
        return filepath;
    }

    /**
     * Save test result snapshot
     * @param {string} testName - Test name
     * @param {object} result - Test result
     */
    saveTestResult(testName, result) {
        const snapshot = {
            testName: testName,
            passed: result.passed || false,
            duration: result.duration || 0,
            timestamp: new Date().toISOString(),
            details: result.details || {},
            error: result.error || null
        };

        return this.saveSnapshot(`test-result_${testName}`, snapshot);
    }

    /**
     * Save API response snapshot
     * @param {string} endpoint - API endpoint
     * @param {object} response - API response
     */
    saveApiResponse(endpoint, response) {
        const cleanEndpoint = endpoint.replace(/[^a-zA-Z0-9]/g, '_');
        const snapshot = {
            endpoint: endpoint,
            status: response.status || response.statusCode,
            headers: response.headers || {},
            body: response.body || response.data,
            timestamp: new Date().toISOString()
        };

        return this.saveSnapshot(`api_${cleanEndpoint}`, snapshot);
    }

    /**
     * Save database state snapshot
     * @param {string} operation - Database operation
     * @param {object} data - Database data
     */
    saveDatabaseSnapshot(operation, data) {
        const snapshot = {
            operation: operation,
            data: data,
            timestamp: new Date().toISOString()
        };

        return this.saveSnapshot(`db_${operation}`, snapshot);
    }

    /**
     * Save comparison snapshot (before/after)
     * @param {string} name - Comparison name
     * @param {object} before - Before state
     * @param {object} after - After state
     */
    saveComparison(name, before, after) {
        const snapshot = {
            name: name,
            before: before,
            after: after,
            diff: this.calculateDiff(before, after),
            timestamp: new Date().toISOString()
        };

        return this.saveSnapshot(`comparison_${name}`, snapshot);
    }

    /**
     * Calculate simple diff between two objects
     * @param {object} before 
     * @param {object} after 
     */
    calculateDiff(before, after) {
        const diff = {
            added: {},
            removed: {},
            changed: {}
        };

        // Simple diff - can be enhanced
        const beforeKeys = Object.keys(before || {});
        const afterKeys = Object.keys(after || {});

        afterKeys.forEach(key => {
            if (!beforeKeys.includes(key)) {
                diff.added[key] = after[key];
            } else if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
                diff.changed[key] = { before: before[key], after: after[key] };
            }
        });

        beforeKeys.forEach(key => {
            if (!afterKeys.includes(key)) {
                diff.removed[key] = before[key];
            }
        });

        return diff;
    }

    /**
     * Get all snapshots for this test type
     */
    getAllSnapshots() {
        const files = fs.readdirSync(this.snapshotDir);
        return files.filter(f => f.endsWith('.json'));
    }

    /**
     * Clean old snapshots (keep last N)
     * @param {number} keepLast - Number of snapshots to keep
     */
    cleanOldSnapshots(keepLast = 10) {
        const files = this.getAllSnapshots();
        if (files.length > keepLast) {
            const sorted = files.sort().reverse();
            const toDelete = sorted.slice(keepLast);

            toDelete.forEach(file => {
                fs.unlinkSync(path.join(this.snapshotDir, file));
            });

            console.log(`🧹 Cleaned ${toDelete.length} old snapshots`);
        }
    }
}

module.exports = SnapshotUtil;
