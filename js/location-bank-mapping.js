// Location to Bank Account Mapping
// Used for payroll journal entries to determine which bank account to credit

class LocationBankMapping {
    constructor() {
        // Mapping based on store IDs (fl008, fl009, etc.)
        this.mapping = {
            // Store ID format (lowercase)
            'fl008': 'Fifth Third Checking 4681',
            'fl009': 'PNC Bank - Checking 6662',
            'fl010': 'PNC Bank - Checking 2691',
            'fl017': 'Fifth Third Checking 0844',
            'fl024': 'PNC Checking',
            'fl035': 'PNC Bank - Checking 3723',
            'fl041': 'Fifth Third Checking 3308',
            'fl045': 'PNC Bank - Checking 6107',
            'fl046': 'PNC Bank - Checking 6115',
            'fl051': 'FLORIDA PIZZA 8 LLC (6602) -1',
            'cc': 'PNC Checking',

            // Also support numeric location codes from Paylocity PDFs
            '300': 'Fifth Third Checking 4681',  // fl008
            '400': 'PNC Bank - Checking 6662',   // fl009
            '500': 'PNC Bank - Checking 2691',   // fl010
            '525': 'Fifth Third Checking 0844',  // fl017
            '600': 'PNC Checking',               // fl024
            '700': 'PNC Bank - Checking 3723',   // fl035
            '800': 'Fifth Third Checking 3308',  // fl041
            '900': 'PNC Bank - Checking 6107',   // fl045
            '1000': 'PNC Bank - Checking 6115',  // fl046
            '1100': 'FLORIDA PIZZA 8 LLC (6602) -1' // fl051
        };
    }

    // Get bank account for a location code (case-insensitive)
    getBankAccount(locationCode) {
        if (!locationCode) {
            console.warn(`⚠️ No location code provided, using default`);
            return 'Fifth Third Checking 4681'; // Default to fl008
        }

        // Try lowercase lookup
        const bank = this.mapping[locationCode.toLowerCase()];
        if (!bank) {
            console.warn(`⚠️ No bank account mapped for location: ${locationCode}, using default`);
            return 'Fifth Third Checking 4681'; // Default to fl008
        }
        return bank;
    }

    // Check if a location exists in mapping
    hasLocation(locationCode) {
        return locationCode && (locationCode.toLowerCase() in this.mapping);
    }
}
