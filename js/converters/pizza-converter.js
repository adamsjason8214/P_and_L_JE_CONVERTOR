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
            "Net Sales": /NET\s+SALES\s+\$?\s*([\d,]+\.\d{2})/i,
            "Taxes": /Taxes?\s+\$?\s*([\d,]+\.\d{2})/i,
            "Delivery Fees": /Delivery\s+Charges\s+\d+\s+\$?\s*([\d,]+\.\d{2})/i,
            "Min Charges": /Min\s+Charges\s+\d+\s+\$?\s*([\d,]+\.\d{2})/i,
            "House Account Sales": /House\s+Account\s+Sales\s+\(?\$?\s*-?([\d,]+\.\d{2})\)?/i,
            "House Account Payments": /House\s+Account\s+Payments\s+\$?\s*([\d,]+\.\d{2})/i,
            "Gift Card Activations and Add": /Gift\s+Card\s+Activations?\s+and\s+Add\s+\$?\s*([\d,]+\.\d{2})/i,
            "Third-Party Delivery Tips": /Third-Party\s+Delivery\s+Tips\s+\$?\s*([\d,]+\.\d{2})/i,

            // Discounts & Comps
            "Non Vouchered Customer Credits": /Non-?Vouchered\s+\d+\s+\$?\s*([\d,]+\.\d{2})/i,
            "Customer Credits": /Customer\s+Credits\s+\d+\s+\$?\s*([\d,]+\.\d{2})/i,
            "Discounts": /Discounts\s+\d+\s+\$?\s*([\d,]+\.\d{2})/i,
            "Order Discounts": /Order\s+Discounts\s+\d+\s+\$?\s*([\d,]+\.\d{2})/i,
            "Complimentary": /Complimentary\s+\d+\s+\$?\s*([\d,]+\.\d{2})/i,

            // Tenders
            "Cash": /Cash\s+\$?\s*([\d,]+\.\d{2})/i,
            "Visa": /Visa\s+\$?\s*([\d,]+\.\d{2})/i,
            "UberEats": /UberEats\s+\$?\s*([\d,]+\.\d{2})|UBER\s+EATS\s+\$?\s*([\d,]+\.\d{2})/i,
            "Amex": /American\s+Express\s+\$?\s*([\d,]+\.\d{2})|AMEX\s+\$?\s*([\d,]+\.\d{2})/i,
            "Grubhub": /Grub[Hh]ub\s+\$?\s*([\d,]+\.\d{2})/i,
            "Door Dash": /Door\s*Dash\s+\$?\s*([\d,]+\.\d{2})/i,
            "Discover": /Discover\s+\$?\s*([\d,]+\.\d{2})/i,
            "Mastercard": /Master[Cc]ard\s+\$?\s*([\d,]+\.\d{2})/i,
            "Text Order Credit": /Text\s+Order\s+Credit\s+\$?\s*([\d,]+\.\d{2})/i,
            "Online Ordering": /Online\s+Ordering\s+\$?\s*([\d,]+\.\d{2})/i,
            "EZ CATER": /EZ\s+CATER\s+\$?\s*([\d,]+\.\d{2})/i,
            "Gift Card": /Gift\s+\$?\s*([\d,]+\.\d{2})/i,
            "Square": /Square\s+\$?\s*([\d,]+\.\d{2})/i,
            "Check": /Check\s+\$?\s*([\d,]+\.\d{2})/i,
            "JetBot Prepaid": /JetBot\s+Prepaid\s+\$?\s*([\d,]+\.\d{2})/i,
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
        // Look for ITEM CATEGORIES SOLD section
        const categorySection = text.match(/ITEM\s+CATEGORIES\s+SOLD([\s\S]*?)(?:Sales\/Tender|$)/i);
        if (!categorySection) return {};

        const sectionText = categorySection[1];
        const categories = {};

        // Extract each category with its Gross value
        const categoryPatterns = {
            "Beverage": /Beverage\s+\d+\s+\$?\s*([\d,]+\.\d{2})/i,
            "Catering": /Catering\s+\d+\s+\$?\s*([\d,]+\.\d{2})/i,
            "Dessert": /Dessert\s+\d+\s+\$?\s*([\d,]+\.\d{2})/i,
            "Jet's Bread": /Jet'?s\s+Bread\s+\d+\s+\$?\s*([\d,]+\.\d{2})/i,
            "Pizza": /Pizza\s+\d+\s+\$?\s*([\d,]+\.\d{2})/i,
            "Salad": /Salad\s+\d+\s+\$?\s*([\d,]+\.\d{2})/i,
            "Sandwiches": /Sandwiches?\s+\d+\s+\$?\s*([\d,]+\.\d{2})/i,
            "Sides": /Sides?\s+\d+\s+\$?\s*([\d,]+\.\d{2})/i,
            "Wings": /Wings?\s+\d+\s+\$?\s*([\d,]+\.\d{2})/i
        };

        for (const [category, pattern] of Object.entries(categoryPatterns)) {
            const value = this.extractValue(sectionText, pattern);
            categories[category] = value;
        }

        return categories;
    }

    extractData(text) {
        const data = {};

        // Extract basic fields
        for (const [field, pattern] of Object.entries(this.patterns)) {
            data[field] = this.extractValue(text, pattern);
        }

        // Handle Delivery Fees (Delivery Charges + Min Charges)
        const deliveryCharges = this.extractValue(text, this.patterns["Delivery Fees"]);
        const minCharges = this.extractValue(text, this.patterns["Min Charges"]);
        data["Delivery Fees"] = deliveryCharges + minCharges;

        // Handle House Account Sales (should be negative in source)
        const houseAccountSalesMatch = text.match(/House\s+Account\s+Sales\s+\((\d+[\d,]*\.\d{2})\)/i);
        if (houseAccountSalesMatch) {
            data["House Account Sales"] = -parseFloat(houseAccountSalesMatch[1].replace(/,/g, ''));
        }

        // Extract item categories
        const categories = this.extractItemCategories(text);
        Object.assign(data, categories);

        // Calculate Credit Cards Total
        data["Credit Cards Total"] = (data["Visa"] || 0) + (data["Mastercard"] || 0) +
            (data["Discover"] || 0) + (data["Amex"] || 0);

        // Calculate F&B Total
        data["F&B Total"] = (data["Beverage"] || 0) + (data["Catering"] || 0) +
            (data["Dessert"] || 0) + (data["Jet's Bread"] || 0) + (data["Pizza"] || 0) +
            (data["Salad"] || 0) + (data["Sandwiches"] || 0) + (data["Sides"] || 0) +
            (data["Wings"] || 0);

        // Initialize all fields in rowOrder with 0 if not present
        for (const field of this.rowOrder) {
            if (!(field in data)) {
                data[field] = 0;
            }
        }

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
