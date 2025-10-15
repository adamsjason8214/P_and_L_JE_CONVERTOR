// Food Safety Reference Data
// Based on Delaware General Health District Food Safety Packet

class FoodSafetyData {
    constructor() {
        // Critical food safety temperatures
        this.temperatures = {
            cooking: {
                poultry: { temp: 165, label: 'Poultry, Reheated Leftovers' },
                groundMeat: { temp: 155, label: 'Ground Beef/Pork, Raw Eggs (hot holding)' },
                wholeM

eats: { temp: 145, label: 'Fish, Shellfish, Whole Beef/Pork/Lamb, Eggs (immediate service)' },
                hotHolding: { temp: 135, label: 'Vegetables, Pre-cooked Foods, Hot Holding' }
            },
            storage: {
                coldHolding: { temp: 41, label: 'Cold Holding Temperature (or below)' },
                freezing: { temp: 0, label: 'Freezer Temperature (or below)' }
            },
            cooling: {
                step1: { from: 135, to: 70, time: '2 hours', label: 'Step 1: Cool from 135°F to 70°F' },
                step2: { from: 70, to: 41, time: '4 hours', label: 'Step 2: Cool from 70°F to 41°F' },
                total: '6 hours maximum total cooling time'
            }
        };

        // Pizza slice hold time rule (critical for this app)
        this.pizzaSliceRule = {
            holdTime: 60, // minutes
            warningTime: 50, // minutes (10 min warning)
            temperature: 135, // °F minimum hold temperature
            description: 'Pizza slices must be discarded after 1 hour out of the oven'
        };

        // Date marking rules
        this.dateMarking = {
            coldStorage: {
                days: 7,
                temperature: 41,
                description: 'Ready-to-eat TCS foods must be date marked and used or discarded within 7 days at 41°F or below'
            }
        };

        // Sanitizer concentrations
        this.sanitizers = {
            chlorine: { ppm: '50-100', time: '10 seconds' },
            quaternaryAmmonium: { ppm: 'per manufacturer specs', time: 'per manufacturer specs' },
            iodine: { ppm: '12.5-25', time: '30 seconds' }
        };

        // Handwashing reminders
        this.handwashing = {
            duration: 20, // seconds
            washBefore: [
                'Your shift begins',
                'Handling food',
                'Putting on clean gloves'
            ],
            washAfter: [
                'Using the toilet',
                'Handling raw foods',
                'Taking a break/smoking',
                'Coughing, sneezing, eating, drinking',
                'Cleaning/taking out trash',
                'As often as necessary to remove soil and contamination'
            ]
        };

        // Refrigerator storage order (top to bottom)
        this.refrigeratorOrder = [
            { level: 1, items: 'Ready-to-eat foods, Pre-cooked foods', color: '#00d4ff' },
            { level: 2, items: 'Fish, Eggs, Whole Beef/Pork/Lamb', color: '#b537f2' },
            { level: 3, items: 'Ground Meats', color: '#ff6b7a' },
            { level: 4, items: 'Poultry - Whole & Ground', color: '#ff4757' }
        ];
    }

    // Get temperature info for display
    getTemperatureInfo(category, type) {
        if (category === 'cooking') {
            return this.temperatures.cooking[type];
        } else if (category === 'storage') {
            return this.temperatures.storage[type];
        }
        return null;
    }

    // Get all cooking temperatures for reference
    getAllCookingTemps() {
        return Object.entries(this.temperatures.cooking).map(([key, value]) => ({
            type: key,
            ...value
        }));
    }

    // Get pizza slice hold time rule
    getPizzaSliceRule() {
        return this.pizzaSliceRule;
    }
}
