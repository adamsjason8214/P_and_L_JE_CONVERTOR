// CSV Generator
class CSVGenerator {
    // Generate consolidated CSV (side-by-side comparison)
    generateConsolidatedCSV(dataByStore, rowOrder) {
        const stores = Object.keys(dataByStore).sort();

        // Header row
        let csv = ',' + stores.join(',') + '\n';

        // Data rows
        for (const category of rowOrder) {
            const values = stores.map(store => {
                const value = dataByStore[store][category];
                if (value === undefined || value === null || value === 0) {
                    return 'N/A';
                }
                return value.toFixed(2);
            });

            csv += `${category},${values.join(',')}\n`;
        }

        return csv;
    }

    // Generate Journal Entry CSV for a single store (QuickBooks format)
    generateJournalEntryCSV(storeId, data, journalDate) {
        const lines = [];

        // Header
        lines.push('*JournalNo,*JournalDate,*AccountName,*Debits,*Credits,Description,Name,Currency,Location,Class');

        const description = 'To record sales';
        const currency = 'USD';

        // Helper function to add line
        const addLine = (accountName, debits, credits, name = '') => {
            const debitStr = debits > 0 ? debits.toFixed(2) : '';
            const creditStr = credits > 0 ? credits.toFixed(2) : '';
            lines.push(`${storeId},${journalDate},${accountName},${debitStr},${creditStr},${description},${name},${currency},,`);
        };

        // DEBITS: Net Sales
        if (data['Net Sales'] > 0) {
            addLine('Sales', data['Net Sales'], 0);
        }

        // CREDITS: Taxes
        if (data['Taxes'] > 0) {
            addLine('State Sales Tax Payable', 0, data['Taxes']);
        }

        // CREDITS: Delivery Fees
        if (data['Delivery Fees'] > 0) {
            addLine('Delivery Income', 0, data['Delivery Fees']);
        }

        // House Account Sales (CREDIT to Accounts Receivable) - only if negative (actual sales)
        if (data['House Account Sales'] < 0) {
            addLine('Accounts Receivable', 0, Math.abs(data['House Account Sales']), 'Accounts Receivable');
        }

        // House Account Payments (DEBIT) - only if positive
        if (data['House Account Payments'] > 0) {
            addLine('Accounts Receivable', data['House Account Payments'], 0, 'Accounts Receivable');
        }

        // Gift Card Activations
        if (data['Gift Card Activations and Add'] > 0) {
            addLine('Gift Cards', 0, data['Gift Card Activations and Add']);
        }

        // Third-Party Delivery Tips (DEBIT)
        if (data['Third-Party Delivery Tips'] > 0) {
            addLine('Third-Party Delivery Fees:Door Dash Drive', data['Third-Party Delivery Tips'], 0);
        }

        // Discounts & Comps (all DEBITS)
        if (data['Non Vouchered Customer Credits'] > 0) {
            addLine('Discounts & Comps:Non-Vouchered', data['Non Vouchered Customer Credits'], 0);
        }

        if (data['Customer Credits'] > 0) {
            addLine('Discounts & Comps:Customer Credits', data['Customer Credits'], 0);
        }

        if (data['Discounts'] > 0) {
            addLine('Discounts & Comps:Discounts', data['Discounts'], 0);
        }

        // Order Discounts -> Third-Party Delivery Fees (DEBIT)
        if (data['Order Discounts'] > 0) {
            addLine('Third-Party Delivery Fees', data['Order Discounts'], 0);
        }

        if (data['Complimentary'] > 0) {
            addLine('Discounts & Comps:Complimentary', data['Complimentary'], 0);
        }

        // Gift Card (Tender) - if used as payment, DEBIT
        if (data['Gift Card'] > 0) {
            addLine('Gift Cards', data['Gift Card'], 0);
        }

        // Item Categories (all CREDITS to Prepared Food Sales)
        const categoryMapping = {
            'Beverage': 'Sales - Pop',
            'Catering': 'Sales - Catering',
            'Dessert': 'Sales - Dessert',
            "Jet's Bread": 'Sales - Jet Bread',
            'Pizza': 'Sales - Pizza',
            'Salad': 'Sales - Salads',
            'Sandwiches': 'Sales - Subs',
            'Sides': 'Sales - Sides',
            'Wings': 'Sales - Wings'
        };

        for (const [category, accountSuffix] of Object.entries(categoryMapping)) {
            if (data[category] > 0) {
                addLine(`Prepared Food Sales:${accountSuffix}`, 0, data[category]);
            }
        }

        // Calculate Cash Over/Short (balancing entry)
        const totalDebits = this.calculateTotalDebits(data);
        const totalCredits = this.calculateTotalCredits(data);
        const difference = totalCredits - totalDebits;

        if (Math.abs(difference) > 0.01) {
            addLine('Operating Expenses:Cash (Over)/Short', difference, 0);
        }

        return lines.join('\n') + '\n';
    }

    calculateTotalDebits(data) {
        let total = 0;

        // Net Sales
        total += data['Net Sales'] || 0;

        // House Account Payments
        total += data['House Account Payments'] || 0;

        // Third-Party Delivery Tips
        total += data['Third-Party Delivery Tips'] || 0;

        // Discounts & Comps
        total += data['Non Vouchered Customer Credits'] || 0;
        total += data['Customer Credits'] || 0;
        total += data['Discounts'] || 0;
        total += data['Order Discounts'] || 0;
        total += data['Complimentary'] || 0;

        // Gift Card (as payment)
        total += data['Gift Card'] || 0;

        return total;
    }

    calculateTotalCredits(data) {
        let total = 0;

        // Taxes
        total += data['Taxes'] || 0;

        // Delivery Fees
        total += data['Delivery Fees'] || 0;

        // House Account Sales (absolute value since it's negative)
        if (data['House Account Sales'] < 0) {
            total += Math.abs(data['House Account Sales']);
        }

        // Gift Card Activations
        total += data['Gift Card Activations and Add'] || 0;

        // Item Categories
        const categories = ['Beverage', 'Catering', 'Dessert', "Jet's Bread", 'Pizza', 'Salad', 'Sandwiches', 'Sides', 'Wings'];
        for (const category of categories) {
            total += data[category] || 0;
        }

        return total;
    }

    // Download CSV file
    downloadCSV(filename, content) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Generate and download ZIP file with all journal entries
    async downloadJournalEntriesZip(dataByStore, journalDate) {
        const zip = new JSZip();

        for (const [storeId, data] of Object.entries(dataByStore)) {
            const csv = this.generateJournalEntryCSV(storeId, data, journalDate);
            zip.file(`${storeId}.csv`, csv);
        }

        const content = await zip.generateAsync({ type: 'blob' });

        const link = document.createElement('a');
        const url = URL.createObjectURL(content);
        link.setAttribute('href', url);
        link.setAttribute('download', 'journal_entries.zip');
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // ========== PAYROLL JOURNAL ENTRY METHODS ==========

    // Generate Payroll Journal Entry CSV (QuickBooks format)
    generatePayrollJournalEntryCSV(payrollData, journalDate, journalNo) {
        const lines = [];

        // Header
        lines.push('*JournalNo,*JournalDate,*AccountName,*Debits,*Credits,Description,Name,Currency,Location,Class');

        const description = 'To record payroll';
        const currency = 'USD';

        // Helper function to add line
        const addLine = (accountName, debits, credits, name = '') => {
            const debitStr = debits > 0 ? debits.toFixed(2) : '';
            const creditStr = credits > 0 ? credits.toFixed(2) : '';
            lines.push(`${journalNo},${journalDate},${accountName},${debitStr},${creditStr},${description},${name},${currency},,`);
        };

        const totals = payrollData.reportTotals;

        // DEBITS: Salaries & Wages (REG + OT + HOLIDAY + RETRO + CASH)
        const salariesWages =
            (totals.earnings.REG || 0) +
            (totals.earnings.OT || 0) +
            (totals.earnings.HOLIDAY || 0) +
            (totals.earnings.RETRO || 0) +
            (totals.earnings.CASH || 0);

        if (salariesWages > 0) {
            addLine('Payroll Expenses:Salaries & Wages:Salaries & Wages', salariesWages, 0);
        }

        // DEBITS: Management Bonuses
        if (totals.earnings.BONUS > 0) {
            addLine('Payroll Expenses:Salaries & Wages:Management Bonuses', totals.earnings.BONUS, 0);
        }

        // DEBITS: Guaranteed Payments
        if (totals.earnings.DRAW > 0) {
            addLine('Payroll Expenses:Guaranteed Payments:Guaranteed Payments', totals.earnings.DRAW, 0);
        }

        // DEBITS: Guaranteed Payments - Bonus
        if (totals.earnings.DBONU > 0) {
            addLine('Payroll Expenses:Guaranteed Payments:Guaranteed Payments - Bonus', totals.earnings.DBONU, 0);
        }

        // DEBITS: Payroll Taxes (Employer portion)
        const payrollTaxes =
            (totals.employerTaxes['MED-R'] || 0) +
            (totals.employerTaxes['SS-R'] || 0) +
            (totals.employerTaxes.FLSUI || 0) +
            (totals.employerTaxes.FUTA || 0);

        if (payrollTaxes > 0) {
            addLine('Payroll Expenses:Payroll Taxes', payrollTaxes, 0);
        }

        // DEBITS: Mileage Reimbursement
        if (totals.deductions.MILES > 0) {
            addLine('Delivery Income:Mileage Reimbursement', totals.deductions.MILES, 0);
        }

        // CREDITS: Medical Insurance
        const medicalInsurance = (totals.deductions.MDCL || 0) + (totals.deductions.MDCLP || 0);
        if (medicalInsurance > 0) {
            addLine('Insurance:Medical Insurance', 0, medicalInsurance);
        }

        // CREDITS: Bank account (Net pay for this location)
        if (payrollData.netPay > 0 && payrollData.bankAccount) {
            addLine(payrollData.bankAccount, 0, payrollData.netPay);
            console.log(`💳 Bank Credit: ${payrollData.bankAccount} - $${payrollData.netPay.toFixed(2)}`);
        } else {
            console.warn('⚠️ No net pay or bank account found for journal entry');
        }

        return lines.join('\n') + '\n';
    }

    // Download single payroll journal entry CSV
    downloadPayrollJournalEntry(payrollData, journalDate, journalNo) {
        const csv = this.generatePayrollJournalEntryCSV(payrollData, journalDate, journalNo);
        const filename = `Payroll_${journalNo}.csv`;
        this.downloadCSV(filename, csv);
    }
}
