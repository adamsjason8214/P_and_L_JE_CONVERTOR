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

            // Extract text from all pages, preserving line structure
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();

                // Group text items by Y coordinate (same line)
                const lines = this.groupTextItemsByLine(textContent.items);

                // Join items on each line with space, then join lines with newline
                const pageText = lines.map(line => line.join(' ')).join('\n');

                fullText += pageText + '\n';
            }

            console.log('📄 Extracted PDF text (first 500 chars):', fullText.substring(0, 500));
            return fullText;
        } catch (error) {
            console.error('Error extracting PDF text:', error);
            throw new Error(`Failed to extract text from ${file.name}: ${error.message}`);
        }
    }

    // Group text items that are on the same line (similar Y coordinates)
    groupTextItemsByLine(items) {
        if (!items || items.length === 0) return [];

        const lines = [];
        let currentLine = [];
        let lastY = null;
        const yTolerance = 2; // pixels - items within this range are on same line

        for (const item of items) {
            const y = item.transform[5]; // Y coordinate

            if (lastY === null || Math.abs(y - lastY) <= yTolerance) {
                // Same line
                currentLine.push(item.str);
            } else {
                // New line
                if (currentLine.length > 0) {
                    lines.push(currentLine);
                }
                currentLine = [item.str];
            }

            lastY = y;
        }

        // Add last line
        if (currentLine.length > 0) {
            lines.push(currentLine);
        }

        return lines;
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
