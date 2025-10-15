// Food Safety Tracker - Pizza Slice Hold Time Tracker
// Tracks pizza slices from oven to discard (1-hour rule)

class FoodSafetyTracker {
    constructor() {
        this.safetyData = new FoodSafetyData();
        this.activeBatches = [];
        this.discardedBatches = [];
        this.updateInterval = null;
        this.loadFromStorage();
    }

    // Add a new batch of pizza slices
    addBatch(description = 'Pizza Slices') {
        const batch = {
            id: Date.now(),
            description: description,
            startTime: new Date(),
            holdTimeMinutes: this.safetyData.pizzaSliceRule.holdTime,
            warningTimeMinutes: this.safetyData.pizzaSliceRule.warningTime,
            status: 'safe', // safe, warning, expired
            discarded: false
        };

        this.activeBatches.push(batch);
        this.saveToStorage();
        return batch;
    }

    // Get time remaining for a batch (in minutes)
    getTimeRemaining(batch) {
        const now = new Date();
        const startTime = new Date(batch.startTime);
        const elapsedMinutes = (now - startTime) / 1000 / 60;
        const remaining = batch.holdTimeMinutes - elapsedMinutes;
        return Math.max(0, remaining);
    }

    // Get elapsed time for a batch (in minutes)
    getElapsedTime(batch) {
        const now = new Date();
        const startTime = new Date(batch.startTime);
        return (now - startTime) / 1000 / 60;
    }

    // Update batch status based on time
    updateBatchStatus(batch) {
        const remaining = this.getTimeRemaining(batch);
        const elapsed = this.getElapsedTime(batch);

        if (remaining <= 0) {
            batch.status = 'expired';
        } else if (elapsed >= batch.warningTimeMinutes) {
            batch.status = 'warning';
        } else {
            batch.status = 'safe';
        }

        return batch.status;
    }

    // Mark batch as discarded
    discardBatch(batchId) {
        const index = this.activeBatches.findIndex(b => b.id === batchId);
        if (index !== -1) {
            const batch = this.activeBatches[index];
            batch.discarded = true;
            batch.discardTime = new Date();

            this.discardedBatches.push(batch);
            this.activeBatches.splice(index, 1);
            this.saveToStorage();

            return batch;
        }
        return null;
    }

    // Get all active batches with updated status
    getActiveBatches() {
        return this.activeBatches.map(batch => {
            this.updateBatchStatus(batch);
            return {
                ...batch,
                timeRemaining: this.getTimeRemaining(batch),
                elapsedTime: this.getElapsedTime(batch)
            };
        });
    }

    // Get today's discarded batches
    getTodayDiscarded() {
        const today = new Date().toDateString();
        return this.discardedBatches.filter(batch => {
            const discardDate = new Date(batch.discardTime).toDateString();
            return discardDate === today;
        });
    }

    // Generate compliance log for today
    generateDailyLog() {
        const today = new Date().toDateString();
        const todayBatches = this.discardedBatches.filter(batch => {
            const discardDate = new Date(batch.discardTime).toDateString();
            return discardDate === today;
        });

        const log = {
            date: today,
            batches: todayBatches.length,
            compliance: this.checkCompliance(todayBatches),
            details: todayBatches.map(batch => ({
                description: batch.description,
                startTime: new Date(batch.startTime).toLocaleTimeString(),
                discardTime: new Date(batch.discardTime).toLocaleTimeString(),
                elapsed: Math.round(this.getElapsedTime(batch)),
                withinLimit: this.getElapsedTime(batch) <= batch.holdTimeMinutes
            }))
        };

        return log;
    }

    // Check if all batches were discarded within time limit
    checkCompliance(batches) {
        if (batches.length === 0) return true;

        return batches.every(batch => {
            const elapsed = (new Date(batch.discardTime) - new Date(batch.startTime)) / 1000 / 60;
            return elapsed <= batch.holdTimeMinutes;
        });
    }

    // Export daily log as CSV
    exportDailyLogCSV() {
        const log = this.generateDailyLog();
        const lines = [];

        // Header
        lines.push(`Food Safety Log - ${log.date}`);
        lines.push(`Total Batches Discarded: ${log.batches}`);
        lines.push(`Compliance Status: ${log.compliance ? 'PASS' : 'FAIL'}`);
        lines.push('');
        lines.push('Description,Start Time,Discard Time,Hold Time (min),Within Limit');

        // Data
        log.details.forEach(batch => {
            lines.push([
                batch.description,
                batch.startTime,
                batch.discardTime,
                batch.elapsed,
                batch.withinLimit ? 'YES' : 'NO'
            ].join(','));
        });

        return lines.join('\n');
    }

    // Save to localStorage
    saveToStorage() {
        try {
            localStorage.setItem('foodSafety_activeBatches', JSON.stringify(this.activeBatches));
            localStorage.setItem('foodSafety_discardedBatches', JSON.stringify(this.discardedBatches));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
    }

    // Load from localStorage
    loadFromStorage() {
        try {
            const active = localStorage.getItem('foodSafety_activeBatches');
            const discarded = localStorage.getItem('foodSafety_discardedBatches');

            if (active) {
                this.activeBatches = JSON.parse(active);
            }
            if (discarded) {
                this.discardedBatches = JSON.parse(discarded);
                // Clean up old logs (keep only last 30 days)
                this.cleanOldLogs();
            }
        } catch (e) {
            console.error('Failed to load from localStorage:', e);
            this.activeBatches = [];
            this.discardedBatches = [];
        }
    }

    // Clean up logs older than 30 days
    cleanOldLogs() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        this.discardedBatches = this.discardedBatches.filter(batch => {
            const discardDate = new Date(batch.discardTime);
            return discardDate >= thirtyDaysAgo;
        });

        this.saveToStorage();
    }

    // Clear all data (for testing or reset)
    clearAll() {
        this.activeBatches = [];
        this.discardedBatches = [];
        this.saveToStorage();
    }
}
