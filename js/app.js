// Sales Application Logic (Pizza Converter)
class SalesApp {
    constructor() {
        this.files = [];
        this.parsedData = null;
        this.pdfParser = new PDFParser();
        this.pizzaConverter = new PizzaConverter();
        this.csvGenerator = new CSVGenerator();

        this.initializeElements();
        this.initializeEventListeners();
        this.setDefaultDate();
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.fileList = document.getElementById('fileList');
        this.journalDate = document.getElementById('journalDate');
        this.processBtn = document.getElementById('processBtn');
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.resultsSection = document.getElementById('resultsSection');
        this.jeCount = document.getElementById('jeCount');
        this.downloadConsolidated = document.getElementById('downloadConsolidated');
        this.downloadJournalEntries = document.getElementById('downloadJournalEntries');
        this.resetBtn = document.getElementById('resetBtn');
    }

    initializeEventListeners() {
        // Upload area click
        this.uploadArea.addEventListener('click', () => {
            this.fileInput.click();
        });

        // File input change
        this.fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('drag-over');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('drag-over');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });

        // Process button
        this.processBtn.addEventListener('click', () => {
            this.processFiles();
        });

        // Download buttons
        this.downloadConsolidated.addEventListener('click', () => {
            this.downloadConsolidatedCSV();
        });

        this.downloadJournalEntries.addEventListener('click', () => {
            this.downloadJournalEntriesZip();
        });

        // Reset button
        this.resetBtn.addEventListener('click', () => {
            this.reset();
        });

        // Journal date validation
        this.journalDate.addEventListener('change', () => {
            this.updateProcessButton();
        });
    }

    setDefaultDate() {
        // Set default date to last day of previous month
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        const dateString = lastMonth.toISOString().split('T')[0];
        this.journalDate.value = dateString;
    }

    handleFiles(fileList) {
        const newFiles = Array.from(fileList).filter(file => {
            if (file.type !== 'application/pdf') {
                alert(`${file.name} is not a PDF file`);
                return false;
            }
            return true;
        });

        this.files = [...this.files, ...newFiles];
        this.renderFileList();
        this.updateProcessButton();
    }

    renderFileList() {
        if (this.files.length === 0) {
            this.fileList.innerHTML = '';
            return;
        }

        this.fileList.innerHTML = this.files.map((file, index) => `
            <div class="file-item">
                <div class="file-info">
                    <div class="file-icon">PDF</div>
                    <div class="file-details">
                        <h4>${file.name}</h4>
                        <p>${this.formatFileSize(file.size)}</p>
                    </div>
                </div>
                <button class="file-remove" onclick="salesApp.removeFile(${index})">Remove</button>
            </div>
        `).join('');
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    removeFile(index) {
        this.files.splice(index, 1);
        this.renderFileList();
        this.updateProcessButton();
    }

    updateProcessButton() {
        const hasFiles = this.files.length > 0;
        const hasDate = this.journalDate.value !== '';
        this.processBtn.disabled = !(hasFiles && hasDate);
    }

    async processFiles() {
        try {
            // Hide upload section, show progress
            this.processBtn.disabled = true;
            this.progressSection.style.display = 'block';

            // Step 1: Parse PDFs
            this.updateProgress(0, 'Extracting text from PDFs...');
            const parsedPDFs = [];

            for (let i = 0; i < this.files.length; i++) {
                const file = this.files[i];
                this.updateProgress(
                    (i / this.files.length) * 50,
                    `Processing ${file.name}... (${i + 1}/${this.files.length})`
                );

                const parsed = await this.pdfParser.parsePDF(file);
                parsedPDFs.push(parsed);
            }

            // Step 2: Convert data
            this.updateProgress(60, 'Extracting sales data...');
            this.parsedData = this.pizzaConverter.convert(parsedPDFs);

            // Step 3: Generate CSVs
            this.updateProgress(80, 'Generating CSV files...');

            // Give UI time to update
            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 4: Complete
            this.updateProgress(100, 'Complete!');
            await new Promise(resolve => setTimeout(resolve, 500));

            // Show results
            this.showResults();

        } catch (error) {
            console.error('Error processing files:', error);
            alert('Error processing files: ' + error.message);
            this.reset();
        }
    }

    updateProgress(percent, text) {
        this.progressFill.style.width = percent + '%';
        this.progressText.textContent = text;
    }

    showResults() {
        this.progressSection.style.display = 'none';
        this.resultsSection.style.display = 'block';

        const storeCount = Object.keys(this.parsedData.dataByStore).length;
        this.jeCount.textContent = `${storeCount} journal ${storeCount === 1 ? 'entry' : 'entries'} ready`;
    }

    downloadConsolidatedCSV() {
        const csv = this.csvGenerator.generateConsolidatedCSV(
            this.parsedData.dataByStore,
            this.parsedData.rowOrder
        );

        this.csvGenerator.downloadCSV('pos_consolidated.csv', csv);
    }

    async downloadJournalEntriesZip() {
        const journalDate = this.formatJournalDate(this.journalDate.value);

        await this.csvGenerator.downloadJournalEntriesZip(
            this.parsedData.dataByStore,
            journalDate
        );
    }

    formatJournalDate(dateString) {
        // Convert YYYY-MM-DD to M/D/YY format for QuickBooks
        const date = new Date(dateString + 'T00:00:00');
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const year = date.getFullYear().toString().slice(-2);
        return `${month}/${day}/${year}`;
    }

    reset() {
        this.files = [];
        this.parsedData = null;
        this.fileInput.value = '';
        this.renderFileList();
        this.updateProcessButton();
        this.progressSection.style.display = 'none';
        this.resultsSection.style.display = 'none';
        this.updateProgress(0, 'Preparing...');
    }
}

// Payroll Application Logic
class PayrollApp {
    constructor() {
        this.files = [];
        this.parsedData = null;
        this.pdfParser = new PDFParser();
        this.payrollConverter = new PayrollConverter();
        this.csvGenerator = new CSVGenerator();

        this.initializeElements();
        this.initializeEventListeners();
        this.setDefaultDate();
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadAreaPayroll');
        this.fileInput = document.getElementById('fileInputPayroll');
        this.fileList = document.getElementById('fileListPayroll');
        this.journalDate = document.getElementById('journalDatePayroll');
        this.journalNo = document.getElementById('journalNoPayroll');
        this.processBtn = document.getElementById('processBtnPayroll');
        this.progressSection = document.getElementById('progressSectionPayroll');
        this.progressFill = document.getElementById('progressFillPayroll');
        this.progressText = document.getElementById('progressTextPayroll');
        this.resultsSection = document.getElementById('resultsSectionPayroll');
        this.payrollSummary = document.getElementById('payrollSummary');
        this.payrollJeInfo = document.getElementById('payrollJeInfo');
        this.downloadPayrollJournalEntry = document.getElementById('downloadPayrollJournalEntry');
        this.resetBtn = document.getElementById('resetBtnPayroll');
    }

    initializeEventListeners() {
        // Upload area click
        this.uploadArea.addEventListener('click', () => {
            this.fileInput.click();
        });

        // File input change
        this.fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('drag-over');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('drag-over');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });

        // Process button
        this.processBtn.addEventListener('click', () => {
            this.processFiles();
        });

        // Download button
        this.downloadPayrollJournalEntry.addEventListener('click', () => {
            this.downloadJournalEntry();
        });

        // Reset button
        this.resetBtn.addEventListener('click', () => {
            this.reset();
        });

        // Journal date and number validation
        this.journalDate.addEventListener('change', () => {
            this.updateProcessButton();
        });

        this.journalNo.addEventListener('input', () => {
            this.updateProcessButton();
        });
    }

    setDefaultDate() {
        // Set default date to last day of previous month
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        const dateString = lastMonth.toISOString().split('T')[0];
        this.journalDate.value = dateString;

        // Set default journal number
        const month = (lastMonth.getMonth() + 1).toString().padStart(2, '0');
        const day = lastMonth.getDate().toString().padStart(2, '0');
        const year = lastMonth.getFullYear().toString().slice(-2);
        this.journalNo.value = `Payroll ${month}.${day}.${year}`;
    }

    handleFiles(fileList) {
        const newFiles = Array.from(fileList).filter(file => {
            if (file.type !== 'application/pdf') {
                alert(`${file.name} is not a PDF file`);
                return false;
            }
            return true;
        });

        this.files = [...this.files, ...newFiles];
        this.renderFileList();
        this.updateProcessButton();
    }

    renderFileList() {
        if (this.files.length === 0) {
            this.fileList.innerHTML = '';
            return;
        }

        this.fileList.innerHTML = this.files.map((file, index) => `
            <div class="file-item">
                <div class="file-info">
                    <div class="file-icon">PDF</div>
                    <div class="file-details">
                        <h4>${file.name}</h4>
                        <p>${this.formatFileSize(file.size)}</p>
                    </div>
                </div>
                <button class="file-remove" onclick="payrollApp.removeFile(${index})">Remove</button>
            </div>
        `).join('');
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    removeFile(index) {
        this.files.splice(index, 1);
        this.renderFileList();
        this.updateProcessButton();
    }

    updateProcessButton() {
        const hasFiles = this.files.length > 0;
        const hasDate = this.journalDate.value !== '';
        const hasJournalNo = this.journalNo.value.trim() !== '';
        this.processBtn.disabled = !(hasFiles && hasDate && hasJournalNo);
    }

    async processFiles() {
        try {
            // Hide upload section, show progress
            this.processBtn.disabled = true;
            this.progressSection.style.display = 'block';

            // Step 1: Parse PDFs
            this.updateProgress(0, 'Extracting text from PDFs...');
            const parsedPDFs = [];

            for (let i = 0; i < this.files.length; i++) {
                const file = this.files[i];
                this.updateProgress(
                    (i / this.files.length) * 50,
                    `Processing ${file.name}... (${i + 1}/${this.files.length})`
                );

                const parsed = await this.pdfParser.parsePDF(file);
                parsedPDFs.push(parsed);
            }

            // Step 2: Convert data
            this.updateProgress(60, 'Extracting payroll data...');
            this.parsedData = this.payrollConverter.convert(parsedPDFs);

            // Step 3: Complete
            this.updateProgress(100, 'Complete!');
            await new Promise(resolve => setTimeout(resolve, 500));

            // Show results
            this.showResults();

        } catch (error) {
            console.error('Error processing files:', error);
            alert('Error processing files: ' + error.message);
            this.reset();
        }
    }

    updateProgress(percent, text) {
        this.progressFill.style.width = percent + '%';
        this.progressText.textContent = text;
    }

    showResults() {
        this.progressSection.style.display = 'none';
        this.resultsSection.style.display = 'block';

        const totals = this.parsedData.reportTotals;

        // Update summary
        this.payrollSummary.innerHTML = `
            <strong>Location:</strong> ${this.parsedData.location.toUpperCase()}<br>
            <strong>Bank Account:</strong> ${this.parsedData.bankAccount}<br>
            <strong>Total Earnings:</strong> $${totals.totalEarnings.toFixed(2)}<br>
            <strong>Net Pay:</strong> $${this.parsedData.netPay.toFixed(2)}
        `;

        this.payrollJeInfo.textContent = 'Journal entry ready for QuickBooks';
    }

    downloadJournalEntry() {
        const journalDate = this.formatJournalDate(this.journalDate.value);
        const journalNo = this.journalNo.value.trim();

        this.csvGenerator.downloadPayrollJournalEntry(
            this.parsedData,
            journalDate,
            journalNo
        );
    }

    formatJournalDate(dateString) {
        // Convert YYYY-MM-DD to M/D/YY format for QuickBooks
        const date = new Date(dateString + 'T00:00:00');
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const year = date.getFullYear().toString().slice(-2);
        return `${month}/${day}/${year}`;
    }

    reset() {
        this.files = [];
        this.parsedData = null;
        this.fileInput.value = '';
        this.renderFileList();
        this.updateProcessButton();
        this.progressSection.style.display = 'none';
        this.resultsSection.style.display = 'none';
        this.updateProgress(0, 'Preparing...');
    }
}

// Food Safety Application Logic
class FoodSafetyApp {
    constructor() {
        this.tracker = new FoodSafetyTracker();
        this.updateInterval = null;

        this.initializeElements();
        this.initializeEventListeners();
        this.updateDisplay();
        this.startAutoUpdate();
    }

    initializeElements() {
        this.batchDescription = document.getElementById('batchDescription');
        this.addBatchBtn = document.getElementById('addBatchBtn');
        this.activeBatchesList = document.getElementById('activeBatchesList');
        this.batchesDiscarded = document.getElementById('batchesDiscarded');
        this.complianceStatus = document.getElementById('complianceStatus');
        this.todayDiscardedList = document.getElementById('todayDiscardedList');
        this.exportLogBtn = document.getElementById('exportLogBtn');
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
    }

    initializeEventListeners() {
        // Add batch button
        this.addBatchBtn.addEventListener('click', () => {
            this.addBatch();
        });

        // Enter key in description field
        this.batchDescription.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addBatch();
            }
        });

        // Export log button
        this.exportLogBtn.addEventListener('click', () => {
            this.exportLog();
        });

        // Reference tabs
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });
    }

    addBatch() {
        const description = this.batchDescription.value.trim() || 'Pizza Slices';
        this.tracker.addBatch(description);
        this.batchDescription.value = 'Pizza Slices';
        this.updateDisplay();
    }

    updateDisplay() {
        this.updateActiveBatches();
        this.updateDailyLog();
    }

    updateActiveBatches() {
        const batches = this.tracker.getActiveBatches();

        if (batches.length === 0) {
            this.activeBatchesList.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <p>No active batches. Add a batch to start tracking.</p>
                </div>
            `;
            return;
        }

        this.activeBatchesList.innerHTML = batches.map(batch => {
            const minutes = Math.floor(batch.timeRemaining);
            const seconds = Math.floor((batch.timeRemaining - minutes) * 60);
            const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            const startTime = new Date(batch.startTime).toLocaleTimeString();
            const statusClass = batch.status; // safe, warning, expired

            let statusIcon = '';
            let statusText = '';
            if (batch.status === 'safe') {
                statusIcon = '✓';
                statusText = 'Safe';
            } else if (batch.status === 'warning') {
                statusIcon = '⚠';
                statusText = 'Warning - Discard Soon';
            } else {
                statusIcon = '✗';
                statusText = 'EXPIRED - Discard Now';
            }

            return `
                <div class="batch-card ${statusClass}">
                    <div class="batch-header">
                        <div class="batch-info">
                            <h4>${batch.description}</h4>
                            <p class="batch-time">Started: ${startTime}</p>
                        </div>
                        <div class="batch-status ${statusClass}">
                            <span class="status-icon">${statusIcon}</span>
                            <span class="status-text">${statusText}</span>
                        </div>
                    </div>
                    <div class="batch-timer ${statusClass}">
                        <div class="timer-display">${timeString}</div>
                        <div class="timer-label">${batch.status === 'expired' ? 'OVER LIMIT' : 'remaining'}</div>
                    </div>
                    <button class="btn-discard" onclick="foodSafetyApp.discardBatch(${batch.id})">
                        Discard Batch
                    </button>
                </div>
            `;
        }).join('');
    }

    updateDailyLog() {
        const todayBatches = this.tracker.getTodayDiscarded();
        this.batchesDiscarded.textContent = todayBatches.length;

        if (todayBatches.length === 0) {
            this.complianceStatus.textContent = 'N/A';
            this.complianceStatus.className = 'stat-value';
            this.todayDiscardedList.innerHTML = '<p class="empty-log">No batches discarded yet today.</p>';
        } else {
            const log = this.tracker.generateDailyLog();
            this.complianceStatus.textContent = log.compliance ? 'PASS' : 'FAIL';
            this.complianceStatus.className = `stat-value ${log.compliance ? 'compliance-pass' : 'compliance-fail'}`;

            this.todayDiscardedList.innerHTML = todayBatches.map(batch => {
                const startTime = new Date(batch.startTime).toLocaleTimeString();
                const discardTime = new Date(batch.discardTime).toLocaleTimeString();
                const elapsed = Math.round((new Date(batch.discardTime) - new Date(batch.startTime)) / 1000 / 60);
                const withinLimit = elapsed <= batch.holdTimeMinutes;

                return `
                    <div class="discarded-item ${withinLimit ? 'compliant' : 'non-compliant'}">
                        <div class="discarded-info">
                            <strong>${batch.description}</strong>
                            <p>Started: ${startTime} | Discarded: ${discardTime}</p>
                            <p>Hold Time: ${elapsed} minutes</p>
                        </div>
                        <div class="discarded-status ${withinLimit ? 'compliant' : 'non-compliant'}">
                            ${withinLimit ? '✓ Compliant' : '✗ Over Limit'}
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    discardBatch(batchId) {
        this.tracker.discardBatch(batchId);
        this.updateDisplay();
    }

    exportLog() {
        const csv = this.tracker.exportDailyLogCSV();
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const today = new Date().toISOString().split('T')[0];

        link.setAttribute('href', url);
        link.setAttribute('download', `food-safety-log-${today}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    switchTab(tabName) {
        // Update tab buttons
        this.tabBtns.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update tab contents
        this.tabContents.forEach(content => {
            if (content.dataset.tab === tabName) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
    }

    startAutoUpdate() {
        // Update every second for real-time countdown
        this.updateInterval = setInterval(() => {
            this.updateDisplay();
        }, 1000);
    }

    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// Application Controller - manages navigation between converters
class AppController {
    constructor() {
        this.currentSection = 'home';
        this.initializeNavigation();
    }

    initializeNavigation() {
        // Home section buttons
        document.getElementById('selectSalesConverter').addEventListener('click', () => {
            this.showSection('sales');
        });

        document.getElementById('selectPayrollConverter').addEventListener('click', () => {
            this.showSection('payroll');
        });

        document.getElementById('selectFoodSafetyTracker').addEventListener('click', () => {
            this.showSection('foodSafety');
        });

        // Back buttons
        document.getElementById('backFromSales').addEventListener('click', () => {
            this.showSection('home');
        });

        document.getElementById('backFromPayroll').addEventListener('click', () => {
            this.showSection('home');
        });

        document.getElementById('backFromFoodSafety').addEventListener('click', () => {
            this.showSection('home');
        });
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.app-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        switch(sectionName) {
            case 'home':
                document.getElementById('homeSection').classList.add('active');
                break;
            case 'sales':
                document.getElementById('salesConverterSection').classList.add('active');
                break;
            case 'payroll':
                document.getElementById('payrollConverterSection').classList.add('active');
                break;
            case 'foodSafety':
                document.getElementById('foodSafetySection').classList.add('active');
                break;
        }

        this.currentSection = sectionName;
    }
}

// Initialize applications when DOM is ready
let salesApp, payrollApp, foodSafetyApp, appController;
document.addEventListener('DOMContentLoaded', () => {
    appController = new AppController();
    salesApp = new SalesApp();
    payrollApp = new PayrollApp();
    foodSafetyApp = new FoodSafetyApp();
});
