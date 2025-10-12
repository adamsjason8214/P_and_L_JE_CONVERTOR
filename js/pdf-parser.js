// PDF Parser using PDF.js
class PDFParser {
    constructor() {
        // Set worker source for PDF.js
        pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    async extractTextFromPDF(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            let fullText = '';

            // Extract text from all pages
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();

                const pageText = textContent.items
                    .map(item => item.str)
                    .join(' ');

                fullText += pageText + '\n';
            }

            return fullText;
        } catch (error) {
            console.error('Error extracting PDF text:', error);
            throw new Error(`Failed to extract text from ${file.name}: ${error.message}`);
        }
    }

    // Extract Store ID from filename (e.g., "fl008" from "September EOM report.pdf")
    extractStoreIdFromFilename(filename) {
        // Try to match FL### pattern in filename
        const match = filename.match(/fl\s*(\d+)/i);
        if (match) {
            return `FL${match[1].padStart(3, '0')}`;
        }

        // If no match, use filename without extension as store ID
        return filename.replace(/\.(pdf|PDF)$/, '').replace(/[^a-zA-Z0-9]/g, '_');
    }

    // Extract Store ID from PDF text content
    extractStoreIdFromContent(text) {
        // Look for "Store ID: FL###" pattern
        const match = text.match(/Store\s+ID:\s*(FL\d+)/i);
        if (match) {
            return match[1].toUpperCase();
        }
        return null;
    }

    async parsePDF(file) {
        const text = await this.extractTextFromPDF(file);

        // Try to get store ID from content first, then fallback to filename
        let storeId = this.extractStoreIdFromContent(text);
        if (!storeId) {
            storeId = this.extractStoreIdFromFilename(file.name);
        }

        return {
            storeId,
            text,
            filename: file.name
        };
    }
}
