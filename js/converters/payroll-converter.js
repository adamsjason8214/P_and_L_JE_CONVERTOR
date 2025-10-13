// Payroll Converter
// Extracts data from Paylocity "Labor Distribution - Detail" PDF reports

class PayrollConverter {
    constructor() {
        this.locationBankMapping = new LocationBankMapping();

        // Earning types to extract
        this.earningPatterns = {
            'REG': /REG\s+Reg\s+[\d.]+\s+([\d,]+\.[\d]{2})/gi,
            'OT': /OT\s+OT\s+[\d.]+\s+([\d,]+\.[\d]{2})/gi,
            'BONUS': /BONUS\s+Bonus\s+[\d.]+\s+([\d,]+\.[\d]{2})/gi,
            'CASH': /CASH\s+CASH\s+[\d.]+\s+([\d,]+\.[\d]{2})/gi,
            'DBONU': /DBONU\s+dbonu\s+[\d.]+\s+([\d,]+\.[\d]{2})/gi,
            'DRAW': /DRAW\s+DRAW\s+[\d.]+\s+([\d,]+\.[\d]{2})/gi,
            'HOLIDAY': /HOLIDAY\s+Holiday\s+[\d.]+\s+([\d,]+\.[\d]{2})/gi,
            'RETRO': /RETRO\s+Retro\s+[\d.]+\s+([\d,]+\.[\d]{2})/gi
        };

        // Tax patterns (employee taxes - withheld)
        this.taxPatterns = {
            'FITW': /FITW\s+([\d,]+\.[\d]{2})/gi,
            'MED': /MED\s+([\d,]+\.[\d]{2})/gi,
            'SS': /SS\s+([\d,]+\.[\d]{2})/gi,
            'FL': /FL\s+([\d,]+\.[\d]{2})/gi
        };

        // Employer tax patterns
        this.employerTaxPatterns = {
            'MED-R': /MED-R\s+([\d,]+\.[\d]{2})/gi,
            'SS-R': /SS-R\s+([\d,]+\.[\d]{2})/gi,
            'FLSUI': /FLSUI\s+([\d,]+\.[\d]{2})/gi,
            'FUTA': /FUTA\s+([\d,]+\.[\d]{2})/gi
        };

        // Deduction patterns
        this.deductionPatterns = {
            'MDCL': /MDCL\s+Medical\s+([\d,]+\.[\d]{2})/gi,
            'MDCLP': /MDCLP\s+MDCLP\s+([\d,]+\.[\d]{2})/gi,
            'DNTL': /DNTL\s+Dental\s+([\d,]+\.[\d]{2})/gi,
            'DNTLP': /DNTLP\s+DNTLP\s+([\d,]+\.[\d]{2})/gi,
            'VISON': /VISON\s+Vision\s+([\d,]+\.[\d]{2})/gi,
            'VISNP': /VISNP\s+VISNP\s+([\d,]+\.[\d]{2})/gi,
            'MILES': /MILES\s+MILES\s+-?([\d,]+\.[\d]{2})/gi,
            'CASH_DED': /CASH\s+CASH\s+([\d,]+\.[\d]{2})/gi
        };
    }

    extractValue(text, pattern) {
        const matches = [...text.matchAll(pattern)];
        let total = 0;
        matches.forEach(match => {
            if (match[1]) {
                total += parseFloat(match[1].replace(/,/g, ''));
            }
        });
        return total;
    }

    // Extract Report Totals section (page 6 in the sample PDF)
    extractReportTotals(text) {
        console.log('🔍 Extracting Report Totals...');

        const totals = {
            earnings: {},
            employeeTaxes: {},
            employerTaxes: {},
            deductions: {},
            totalEarnings: 0,
            totalTaxes: 0,
            totalEmployerTaxes: 0,
            totalDeductions: 0,
            netPay: 0
        };

        // Look for "Report Totals" section
        const reportTotalsMatch = text.match(/Report\s+Totals[\s\S]+?(?=Paylocity\s+Corporation|$)/i);

        if (!reportTotalsMatch) {
            console.error('❌ Could not find Report Totals section');
            return totals;
        }

        const totalsSection = reportTotalsMatch[0];
        console.log('📊 Found Report Totals section');

        // Extract earnings
        for (const [type, pattern] of Object.entries(this.earningPatterns)) {
            totals.earnings[type] = this.extractValue(totalsSection, pattern);
            if (totals.earnings[type] > 0) {
                console.log(`✓ ${type}: ${totals.earnings[type]}`);
                totals.totalEarnings += totals.earnings[type];
            }
        }

        // Extract employee taxes (withheld)
        for (const [type, pattern] of Object.entries(this.taxPatterns)) {
            totals.employeeTaxes[type] = this.extractValue(totalsSection, pattern);
            if (totals.employeeTaxes[type] > 0) {
                console.log(`✓ Employee Tax ${type}: ${totals.employeeTaxes[type]}`);
                totals.totalTaxes += totals.employeeTaxes[type];
            }
        }

        // Extract employer taxes
        for (const [type, pattern] of Object.entries(this.employerTaxPatterns)) {
            totals.employerTaxes[type] = this.extractValue(totalsSection, pattern);
            if (totals.employerTaxes[type] > 0) {
                console.log(`✓ Employer Tax ${type}: ${totals.employerTaxes[type]}`);
                totals.totalEmployerTaxes += totals.employerTaxes[type];
            }
        }

        // Extract deductions
        for (const [type, pattern] of Object.entries(this.deductionPatterns)) {
            totals.deductions[type] = this.extractValue(totalsSection, pattern);
            if (totals.deductions[type] > 0) {
                console.log(`✓ Deduction ${type}: ${totals.deductions[type]}`);
                totals.totalDeductions += totals.deductions[type];
            }
        }

        // Extract net pay - look for "EE Net" in totals
        const netPayMatch = totalsSection.match(/EE\s+Net\s+([\d,]+\.[\d]{2})/i);
        if (netPayMatch) {
            totals.netPay = parseFloat(netPayMatch[1].replace(/,/g, ''));
            console.log(`💰 Net Pay: ${totals.netPay}`);
        }

        console.log(`📊 Total Earnings: ${totals.totalEarnings}`);
        console.log(`📊 Total Employee Taxes: ${totals.totalTaxes}`);
        console.log(`📊 Total Employer Taxes: ${totals.totalEmployerTaxes}`);
        console.log(`📊 Total Deductions: ${totals.totalDeductions}`);

        return totals;
    }

    // Extract net pay from Report Totals (EE Net)
    extractNetPay(text) {
        console.log('🔍 Extracting net pay from Report Totals...');

        // Look for "EE Net" in the Report Totals section
        const reportTotalsMatch = text.match(/Report\s+Totals[\s\S]+?(?=Paylocity\s+Corporation|$)/i);

        if (!reportTotalsMatch) {
            console.warn('⚠️ Could not find Report Totals section for net pay');
            return 0;
        }

        const totalsSection = reportTotalsMatch[0];
        const netPayMatch = totalsSection.match(/EE\s+Net\s+([\d,]+\.[\d]{2})/i);

        if (netPayMatch) {
            const netPay = parseFloat(netPayMatch[1].replace(/,/g, ''));
            console.log(`💰 Net Pay: $${netPay.toFixed(2)}`);
            return netPay;
        }

        console.warn('⚠️ Could not extract net pay');
        return 0;
    }

    // Main conversion method
    convert(parsedPDFs) {
        console.log('🔄 Starting payroll conversion...');

        const allData = {
            reportTotals: null,
            location: '',
            bankAccount: '',
            netPay: 0,
            companyName: '',
            checkDate: '',
            payPeriod: ''
        };

        // Combine all PDF texts
        const fullText = parsedPDFs.map(pdf => pdf.text).join('\n\n');

        // Extract location from first PDF filename (e.g., "fl008" from "fl008 payroll.pdf")
        const firstPDF = parsedPDFs[0];
        if (firstPDF) {
            allData.location = firstPDF.storeId; // This comes from extractStoreIdFromFilename
            allData.bankAccount = this.locationBankMapping.getBankAccount(allData.location);

            console.log(`📍 Location: ${allData.location}`);
            console.log(`🏦 Bank Account: ${allData.bankAccount}`);

            // Extract company name
            const companyMatch = firstPDF.text.match(/(.+?)\s+\(\d+\)/);
            if (companyMatch) {
                allData.companyName = companyMatch[1].trim();
            }

            // Extract check date
            const checkDateMatch = firstPDF.text.match(/Check\s+Date:\s+(\d{2}[\\/]\d{2}[\\/]\d{4})/i);
            if (checkDateMatch) {
                allData.checkDate = checkDateMatch[1];
            }

            // Extract pay period
            const payPeriodMatch = firstPDF.text.match(/Pay\s+Period:\s+([\d\\/]+\s+to\s+[\d\\/]+)/i);
            if (payPeriodMatch) {
                allData.payPeriod = payPeriodMatch[1];
            }
        }

        // Extract report totals (earnings, taxes, deductions)
        allData.reportTotals = this.extractReportTotals(fullText);

        // Extract net pay from Report Totals
        allData.netPay = this.extractNetPay(fullText);

        console.log('✅ Payroll conversion complete');
        return allData;
    }
}
