# ContractLens - AI Music Contract Analyzer

A modern web application that uses AI to analyze music industry contracts, providing instant summaries, key term extraction, risk assessment, and actionable recommendations.

![ContractLens](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-latest-black)

## Features

- **📄 Multi-Format Support**: Upload PDF, Word documents (.doc, .docx), or plain text files
- **🤖 AI-Powered Analysis**: Uses GPT-4o for comprehensive contract understanding
- **📊 Executive Summary**: Get plain-English summaries of complex legal documents
- **⚠️ Risk Detection**: Automatically identifies problematic clauses and red flags
- **💰 Financial Breakdown**: Extract advance payments, royalty rates, recoupment terms
- **📋 Key Terms Extraction**: Highlights critical clauses with importance ratings
- **💡 Recommendations**: Actionable suggestions for negotiation points
- **🎨 Beautiful UI**: Dark theme with amber/gold accents using shadcn/ui

## Supported Contract Types

- Recording Agreements
- Publishing Deals
- Management Contracts
- Sync Licenses
- Distribution Deals
- Producer Agreements

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key (optional - works with mock data for demo)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd musicccc
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create a .env.local file
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env.local
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Demo Mode

If no OpenAI API key is provided, the application runs in demo mode with mock analysis data. This is useful for testing the UI and understanding the analysis format.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Components**: shadcn/ui
- **AI**: OpenAI GPT-4o
- **Document Parsing**: 
  - pdf-parse (PDFs)
  - mammoth (Word documents)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts    # Contract analysis API endpoint
│   ├── globals.css         # Global styles & theme
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main page component
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── AnalysisProgress.tsx
│   ├── AnalysisResults.tsx
│   └── FileUpload.tsx
├── lib/
│   └── utils.ts            # Utility functions
└── types/
    └── contract.ts         # TypeScript interfaces
```

## API Reference

### POST /api/analyze

Analyzes a music contract and returns structured data.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (PDF, DOCX, DOC, or TXT)

**Response:**
```json
{
  "analysis": {
    "summary": "Executive summary...",
    "contractType": "Recording Agreement",
    "parties": { "artist": "...", "label": "..." },
    "keyTerms": [...],
    "financialTerms": {...},
    "rightsAndOwnership": {...},
    "obligationsAndDeliverables": {...},
    "potentialConcerns": [...],
    "recommendations": [...],
    "overallRiskAssessment": "medium",
    "confidenceScore": 0.85
  }
}
```

## Customization

### Theme

The application uses a dark theme with amber/gold accent colors. Customize in `src/app/globals.css`:

```css
:root {
  --primary: oklch(0.78 0.16 75);  /* Amber/gold */
  --background: oklch(0.12 0.01 250);  /* Dark blue-gray */
  /* ... */
}
```

### AI Prompt

Modify the analysis prompt in `src/app/api/analyze/route.ts` to customize what the AI looks for in contracts.

## Security Notes

- File uploads are limited to 10MB
- Only PDF, Word, and text files are accepted
- Contract text is not stored permanently
- API key is server-side only

## Disclaimer

⚠️ **This tool is for informational purposes only.** AI-powered analysis is not a substitute for professional legal advice. Always consult with a qualified entertainment attorney before signing any contract.

## License

MIT
