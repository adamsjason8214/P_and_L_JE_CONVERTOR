# QuickBooks Journal Entry Converter - Pizza Brand

A web-based tool to convert SpeedLine POS End-of-Month reports into QuickBooks-compatible journal entry CSV files.

## Features

- **Multi-Store Processing**: Upload and process multiple PDF reports at once
- **Two Output Formats**:
  1. **Consolidated CSV**: Side-by-side comparison of all stores
  2. **Journal Entry CSVs**: QuickBooks-ready journal entries for each store
- **No Login Required**: Client-side processing for privacy and security
- **Brand-Specific**: Built specifically for Pizza brand SpeedLine POS reports

## Usage

1. **Upload PDFs**: Drag and drop or click to upload SpeedLine EOM reports
2. **Set Date**: Choose the journal entry date (defaults to last day of previous month)
3. **Process**: Click "Process Files" to extract and convert data
4. **Download**:
   - Download consolidated CSV for analysis
   - Download ZIP file with all individual journal entries

## Supported Data

### Journal Entry Categories
- Sales & Revenue
- Taxes
- Delivery Fees
- Discounts & Comps
- Payment Methods (Credit Cards, Cash, Third-Party, etc.)
- Item Categories (Pizza, Wings, Salads, etc.)

### QuickBooks Format
Generates CSV files with these columns:
- JournalNo (Store ID)
- JournalDate
- AccountName
- Debits
- Credits
- Description
- Name
- Currency

## Technical Details

- **Client-Side Processing**: All PDF parsing and CSV generation happens in your browser
- **Libraries Used**:
  - PDF.js for PDF text extraction
  - JSZip for creating ZIP archives
- **No Backend Required**: Static site deployment

## Adding New Brands

To add support for additional brands:

1. Create a new converter file in `js/converters/`
2. Implement the data extraction logic specific to that brand's POS format
3. Update the interface to allow brand selection

## Development

### File Structure
```
/
├── index.html              # Main interface
├── style.css               # Styling
├── js/
│   ├── app.js             # Main application logic
│   ├── pdf-parser.js      # PDF text extraction
│   ├── csv-generator.js   # CSV generation
│   └── converters/
│       └── pizza-converter.js  # Pizza brand data extraction
├── netlify.toml           # Deployment configuration
└── README.md
```

### Local Development
Simply open `index.html` in a web browser. No build step required.

### Deployment
This project is configured for Netlify deployment. Push to GitHub and connect to Netlify for automatic deployment.

## License

Proprietary - Internal Use Only
