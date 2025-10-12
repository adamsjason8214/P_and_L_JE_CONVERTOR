// Main Application Logic
class App {
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
                <button class="file-remove" onclick="app.removeFile(${index})">Remove</button>
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

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
});
