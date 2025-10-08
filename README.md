# YK-CSV

A web application that extracts text from various file formats and generates CSV files in a specific format for VMix lyrics display.

## Features

- **File Upload**: Supports JPEG, PNG, JPG, PDF, DOC, DOCX, TXT files
- **Text Extraction**: Uses OCR for images and appropriate libraries for documents
- **Text Editing**: In-browser editing interface for lyrics
- **CSV Generation**: Creates CSV files with specific format for VMix
- **VMix Format**: 
  - Column 1: Hindi text + Transliteration (separated by ALT+ENTER)
  - Column 2: Translation

## Technology Stack

### Frontend
- React 18 with TypeScript
- React Dropzone for file uploads
- React Toastify for notifications
- Modern CSS with responsive design

### Backend
- FastAPI (Python)
- OCR: Tesseract with Hindi support
- Document processing: PyPDF2, python-docx
- Image processing: OpenCV, Pillow
- CSV generation: Pandas

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- Python 3.8+
- Tesseract OCR installed on your system

### Install Tesseract OCR

**macOS:**
```bash
brew install tesseract tesseract-lang
```

**Ubuntu/Debian:**
```bash
sudo apt-get install tesseract-ocr tesseract-ocr-hin
```

**Windows:**
Download from: https://github.com/UB-Mannheim/tesseract/wiki

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Start the backend server:
```bash
python main.py
```

The backend will run on `http://localhost:8000`

### Frontend Setup

1. Navigate to root directory:
```bash
cd /Users/praweshgaire/YK-CSV
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Usage

1. **Upload File**: Drag and drop or click to upload a file (JPEG, PNG, PDF, DOC, DOCX, TXT)
2. **Edit Lyrics**: The extracted text will appear in the editing interface where you can:
   - Add Hindi text
   - Edit transliteration
   - Add English translation
   - Add/remove lyric lines
3. **Generate CSV**: Click "Generate & Download CSV" to create and download the CSV file
4. **VMix Import**: Use the downloaded CSV file in VMix for lyrics display

## CSV Format

The generated CSV follows this structure:
```
Column 1                    | Column 2
Hindi Text                  | Translation
ALT+ENTER                  |
Transliteration            |
```

## API Endpoints

- `POST /extract-text`: Extract text from uploaded file
- `POST /generate-csv`: Generate CSV file from lyrics data
- `GET /health`: Health check endpoint

## Development

### Project Structure
```
YK-CSV/
├── backend/
│   ├── main.py
│   └── requirements.txt
├── public/
│   └── index.html
├── src/
│   ├── App.tsx
│   ├── App.css
│   ├── index.tsx
│   └── index.css
├── package.json
└── README.md
```

### Adding New File Types

To support additional file types, modify the `extract_text` function in `backend/main.py` and add the corresponding extraction logic.

## Troubleshooting

### OCR Issues
- Ensure Tesseract is properly installed
- For Hindi text, make sure Hindi language pack is installed
- Check image quality - higher resolution images work better

### File Upload Issues
- Check file size limits
- Verify file format is supported
- Check browser console for errors

### Backend Connection Issues
- Ensure backend is running on port 8000
- Check CORS settings if accessing from different port
- Verify all Python dependencies are installed

## License

This project is for temple keertan lyrics management.
