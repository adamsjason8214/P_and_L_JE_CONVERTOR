// Pizza Brand Converter
// Extracts data from SpeedLine POS PDF reports

class PizzaConverter {
    constructor() {
        // Define the exact row order for consolidated output
        this.rowOrder = [
            // Top
            "Net Sales", "Taxes", "Delivery Fees",
            // Reconciliation
            "House Account Sales", "House Account Payments",
            "Gift Card Activations and Add",
            "Third-Party Delivery Tips",
            // Discounts & Comps
            "Non Vouchered Customer Credits",
            "Customer Credits",
            "Discounts",
            "Order Discounts",
            "Complimentary",
            // Tenders
            "Visa", "Mastercard", "Discover", "Amex", "Cash",
            "UberEats", "Door Dash", "Grubhub", "EZ CATER",
            "Gift Card", "Text Order Credit", "Square", "Online Ordering", "Check", "JetBot Prepaid",
            // Item Categories
            "Beverage", "Catering", "Dessert", "Jet's Bread", "Pizza", "Salad", "Sandwiches", "Sides", "Wings",
            // Summary
            "Credit Cards Total", "F&B Total"
        ];

        // Field patterns for extraction
        this.patterns = {
            "Net Sales": /NET\s+SALES\s+\$?\s*([\d,]+\.[\d]{2})/i,
            "Taxes": /Taxes?\s+\$?\s*([\d,]+\.[\d]{2})/i,
            "Delivery Fees": /Delivery\s+Charges\s+\d+\s+\$?\s*([\d,]+\.[\d]{2})/i,
            "Min Charges": /Min\s+Charges\s+\d+\s+\$?\s*([\d,]+\.[\d]{2})/i,
            "House Account Sales": /House\s+Account\s+Sales\s+\(?\$?\s*-?([\d,]+\.[\d]{2})\)?/i,
            "House Account Payments": /House\s+Account\s+Payments\s+\$?\s*([\d,]+\.[\d]{2})/i,
            "Gift Card Activations and Add": /Gift\s+Card\s+Activations?\s+and\s+Add\s+\$?\s*([\d,]+\.[\d]{2})/i,
            "Third-Party Delivery Tips": /Third[-\s]Party\s+Delivery\s+Tips\s+\$?\s*([\d,]+\.[\d]{2})/i,

            // Discounts & Comps - more flexible patterns
            "Non Vouchered Customer Credits": /Non[-\s]?Vouchered\s+\d+\s+\$?\s*([\d,]+\.[\d]{2})/i,
            "Customer Credits": /Customer\s+Credits\s+\d+\s+\$?\s*([\d,]+\.[\d]{2})/i,
            "Discounts": /(?:^|\s)Discounts\s+\d+\s+\$?\s*([\d,]+\.[\d]{2})/im,
            "Order Discounts": /Order\s+Discounts\s+\d+\s+\$?\s*([\d,]+\.[\d]{2})/i,
            "Complimentary": /Complimentary\s+\d+\s+\$?\s*([\d,]+\.[\d]{2})/i,

            // Tenders
            "Cash": /\bCash\s+\$?\s*([\d,]+\.[\d]{2})/i,
            "Visa": /\bVisa\s+\$?\s*([\d,]+\.[\d]{2})/i,
            "UberEats": /UberEats\s+\$?\s*([\d,]+\.[\d]{2})|UBER\s+EATS\s+\$?\s*([\d,]+\.[\d]{2})/i,
            "Amex": /American\s+Express\s+\$?\s*([\d,]+\.[\d]{2})|AMEX\s+\$?\s*([\d,]+\.[\d]{2})/i,
            "Grubhub": /Grub[Hh]ub\s+\$?\s*([\d,]+\.[\d]{2})|GrubHub\s+\$?\s*([\d,]+\.[\d]{2})/i,
            "Door Dash": /Door\s*Dash\s+\$?\s*([\d,]+\.[\d]{2})|DoorDash\s+\$?\s*([\d,]+\.[\d]{2})/i,
            "Discover": /\bDiscover\s+\$?\s*([\d,]+\.[\d]{2})/i,
            "Mastercard": /Master[Cc]ard\s+\$?\s*([\d,]+\.[\d]{2})/i,
            "Text Order Credit": /Text\s+Order\s+Credit\s+\$?\s*([\d,]+\.[\d]{2})/i,
            "Online Ordering": /Online\s+Ordering\s+\$?\s*([\d,]+\.[\d]{2})/i,
            "EZ CATER": /EZ\s+CATER\s+\$?\s*([\d,]+\.[\d]{2})/i,
            "Gift Card": /\bGift\s+\$?\s*([\d,]+\.[\d]{2})/i,
            "Square": /\bSquare\s+\$?\s*([\d,]+\.[\d]{2})/i,
            "Check": /\bCheck\s+\$?\s*([\d,]+\.[\d]{2})/i,
            "JetBot Prepaid": /JetBot\s+Prepaid\s+\$?\s*([\d,]+\.[\d]{2})/i,
        };
    }

    extractValue(text, pattern) {
        const match = text.match(pattern);
        if (match) {
            // Get first non-undefined captured group
            const value = match.find((m, idx) => idx > 0 && m !== undefined);
            if (value) {
                return parseFloat(value.replace(/,/g, ''));
            }
        }
        return 0;
    }

    extractItemCategories(text) {
        // Look for ITEM CATEGORIES SOLD section with table header
        // The actual data table has "Category Units Gross" header, not just the title
        const categorySection = text.match(/ITEM\s+CATEGORIES\s+SOLD\s+Category\s+Units\s+Gross([\s\S]+?)(?:Sales\/Tender\s+Reconciliation|$)/i);

        if (!categorySection) {
            console.warn('⚠️ ITEM CATEGORIES SOLD table not found in PDF');
            console.log('🔍 Trying alternative extraction method...');

            // Fallback: Look for just "Category Units Gross" which only appears in the table
            const fallbackMatch = text.match(/Category\s+Units\s+Gross([\s\S]+?)(?:Sales\/Tender\s+Reconciliation|SpeedLine|$)/i);
            if (!fallbackMatch) {
                console.error('❌ Could not find ITEM CATEGORIES SOLD table with any method');
                return {};
            }

            const sectionText = fallbackMatch[1];
            console.log('📊 Found table using fallback method');
            console.log('📊 Section text (first 500 chars):', sectionText.substring(0, 500));
            return this.parseItemCategoriesTable(sectionText);
        }

        const sectionText = categorySection[1];
        console.log('📊 ITEM CATEGORIES SOLD table found successfully');
        console.log('📊 Section text (first 500 chars):', sectionText.substring(0, 500));

        // Validate we got the right section (should be substantial, not just nav menu)
        if (sectionText.length < 100) {
            console.error('❌ Section too short - likely captured navigation menu instead of table');
            return {};
        }

        const categories = this.parseItemCategoriesTable(sectionText);
        return categories;
    }

    parseItemCategoriesTable(sectionText) {
        const categories = {};

        // Target categories we're looking for
        const targetCategories = [
            { key: "Beverage", searchTerms: ["Beverage"] },
            { key: "Catering", searchTerms: ["Catering"] },
            { key: "Dessert", searchTerms: ["Dessert"] },
            { key: "Jet's Bread", searchTerms: ["Jet's Bread", "Jets Bread"] },
            { key: "Pizza", searchTerms: ["Pizza"] },
            { key: "Salad", searchTerms: ["Salad"] },
            { key: "Sandwiches", searchTerms: ["Sandwiches", "Sandwich"] },
            { key: "Sides", searchTerms: ["Sides", "Side"] },
            { key: "Wings", searchTerms: ["Wings", "Wing"] }
        ];

        // Strategy 1: Line-by-line extraction
        const lines = sectionText.split('\n');
        console.log(`📊 Analyzing ${lines.length} lines in section`);

        for (const { key, searchTerms } of targetCategories) {
            let found = false;

            for (const line of lines) {
                // Skip modifier lines and empty lines
                if (!line.trim() || line.includes('(modifier)')) continue;

                // Check if line contains the category name
                const lineContainsCategory = searchTerms.some(term =>
                    line.toLowerCase().includes(term.toLowerCase())
                );

                if (lineContainsCategory) {
                    console.log(`🔍 Found line for ${key}: "${line}"`);

                    // Extract all numbers from the line
                    const numbers = line.match(/([\d,]+\.[\d]{2})/g);
                    if (numbers && numbers.length >= 2) {
                        // Second number is Gross (Units is first, Gross is second)
                        const value = parseFloat(numbers[1].replace(/,/g, ''));
                        if (!isNaN(value) && value > 0) {
                            categories[key] = value;
                            console.log(`✓ ${key}: ${value}`);
                            found = true;
                            break;
                        }
                    } else if (numbers && numbers.length === 1) {
                        // Only one number found, might be the Gross value
                        const value = parseFloat(numbers[0].replace(/,/g, ''));
                        if (!isNaN(value) && value > 0) {
                            categories[key] = value;
                            console.log(`✓ ${key}: ${value} (single number)`);
                            found = true;
                            break;
                        }
                    }
                }
            }

            // Strategy 2: Token-based extraction (if line-based failed)
            if (!found) {
                // Split section into words and look for pattern: CategoryName Units Gross
                const tokens = sectionText.split(/\s+/);

                for (let i = 0; i < tokens.length; i++) {
                    const matchesCategory = searchTerms.some(term =>
                        tokens[i].toLowerCase().includes(term.toLowerCase())
                    );

                    if (matchesCategory && i + 2 < tokens.length) {
                        // Look ahead for two numbers: units (i+1) and gross (i+2)
                        const unitsMatch = tokens[i + 1].match(/^(\d+)$/);
                        const grossMatch = tokens[i + 2].match(/^([\d,]+\.[\d]{2})$/);

                        if (unitsMatch && grossMatch) {
                            const value = parseFloat(grossMatch[1].replace(/,/g, ''));
                            if (!isNaN(value) && value > 0) {
                                categories[key] = value;
                                console.log(`✓ ${key}: ${value} (token-based)`);
                                found = true;
                                break;
                            }
                        }
                    }
                }
            }

            if (!found) {
                console.warn(`⚠️ ${key}: not found in ITEM CATEGORIES SOLD`);
                categories[key] = 0;
            }
        }

        return categories;
    }

    extractData(text) {
        console.log('🔍 Starting data extraction...');
        const data = {};

        // Extract basic fields
        for (const [field, pattern] of Object.entries(this.patterns)) {
            data[field] = this.extractValue(text, pattern);
            if (data[field] > 0) {
                console.log(`✓ ${field}: ${data[field]}`);
            }
        }

        // Handle Delivery Fees (Delivery Charges + Min Charges)
        const deliveryCharges = this.extractValue(text, this.patterns["Delivery Fees"]);
        const minCharges = this.extractValue(text, this.patterns["Min Charges"]);
        data["Delivery Fees"] = deliveryCharges + minCharges;
        console.log(`💰 Delivery Fees: ${deliveryCharges} + ${minCharges} = ${data["Delivery Fees"]}`);

        // Handle House Account Sales (should be negative in source)
        const houseAccountSalesMatch = text.match(/House\s+Account\s+Sales\s+\((\d+[\d,]*\.\d{2})\)/i);
        if (houseAccountSalesMatch) {
            data["House Account Sales"] = -parseFloat(houseAccountSalesMatch[1].replace(/,/g, ''));
            console.log(`💳 House Account Sales: ${data["House Account Sales"]} (negative)`);
        } else {
            // Check if it's 0.00 or explicitly stated
            const zeroMatch = text.match(/House\s+Account\s+Sales\s+(0\.00)/i);
            if (zeroMatch) {
                data["House Account Sales"] = 0;
                console.log(`💳 House Account Sales: 0.00`);
            }
        }

        // Extract item categories
        const categories = this.extractItemCategories(text);
        Object.assign(data, categories);

        // Calculate Credit Cards Total
        data["Credit Cards Total"] = (data["Visa"] || 0) + (data["Mastercard"] || 0) +
            (data["Discover"] || 0) + (data["Amex"] || 0);
        console.log(`💳 Credit Cards Total: ${data["Credit Cards Total"]}`);

        // Calculate F&B Total
        data["F&B Total"] = (data["Beverage"] || 0) + (data["Catering"] || 0) +
            (data["Dessert"] || 0) + (data["Jet's Bread"] || 0) + (data["Pizza"] || 0) +
            (data["Salad"] || 0) + (data["Sandwiches"] || 0) + (data["Sides"] || 0) +
            (data["Wings"] || 0);
        console.log(`🍕 F&B Total: ${data["F&B Total"]}`);

        // Initialize all fields in rowOrder with 0 if not present
        for (const field of this.rowOrder) {
            if (!(field in data)) {
                data[field] = 0;
            }
        }

        console.log('✅ Data extraction complete');
        return data;
    }

    convert(parsedPDFs) {
        const dataByStore = {};

        for (const pdf of parsedPDFs) {
            const data = this.extractData(pdf.text);
            dataByStore[pdf.storeId] = data;
        }

        return {
            dataByStore,
            rowOrder: this.rowOrder
        };
    }
}
