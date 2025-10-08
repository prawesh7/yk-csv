from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import pytesseract
import io
import PyPDF2
import docx
from pdf2image import convert_from_bytes
import logging
from PIL import Image
import cv2
import numpy as np
import requests
import json
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Tesseract OCR
tesseract_available = True
try:
    # Test Tesseract availability
    pytesseract.get_tesseract_version()
    logger.info("✅ Tesseract OCR initialized successfully")
except Exception as e:
    logger.error(f"Tesseract OCR not available: {e}")
    tesseract_available = False

app = FastAPI(title="YK-CSV API", description="Extract text from files and generate CSV for VMix lyrics")

# Enable CORS for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://yourdomain.com",  # Replace with your actual domain
        "https://www.yourdomain.com"  # Replace with your actual domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_text_like_imagetotext(image_data: bytes) -> str:
    """ULTRA-ADVANCED OCR - Professional grade text extraction"""
    try:
        logger.info("🚀 Using ULTRA-ADVANCED OCR for professional text extraction...")
        
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        width, height = image.size
        logger.info(f"Original image size: {width}x{height}")
        
        # Try fewer preprocessing strategies for faster processing
        preprocessing_strategies = [
            ("original", image),
            ("upscaled", smart_upscale_image(image)),
            ("enhanced_contrast", enhance_contrast_for_ocr(image)),
            ("combined", combined_preprocessing_for_ocr(image))
        ]
        
        all_results = []
        
        for strategy_name, processed_image in preprocessing_strategies:
            logger.info(f"📸 Testing preprocessing strategy: {strategy_name}")
            
            # Optimized OCR configurations for faster processing
            configs = [
                # Best performing configurations only
                ('hin+eng_psm6', 'hin+eng', '--oem 3 --psm 6'),
                ('hin_only_psm6', 'hin', '--oem 3 --psm 6'),
                ('eng_only_psm6', 'eng', '--oem 3 --psm 6'),
                
                # Legacy configurations
                ('hin+eng_legacy', 'hin+eng', '--oem 1 --psm 6'),
                ('hin_only_legacy', 'hin', '--oem 1 --psm 6')
            ]
            
            for config_name, lang, config in configs:
                try:
                    text = pytesseract.image_to_string(processed_image, lang=lang, config=config)
                    if text and text.strip() and len(text.strip()) > 10:
                        # Calculate quality score
                        score = evaluate_advanced_text_quality(text)
                        all_results.append((f"{strategy_name}_{config_name}", text.strip(), score))
                        logger.info(f"  {config_name}: {len(text.strip())} chars, score: {score:.2f}")
                except Exception as e:
                    logger.warning(f"  {config_name} failed: {e}")
        
        # Sort results by quality score
        all_results.sort(key=lambda x: x[2], reverse=True)
        
        logger.info(f"📊 Total OCR attempts: {len(all_results)}")
        
        if all_results:
            best_result, best_score = all_results[0][1], all_results[0][2]
            logger.info(f"🏆 Best OCR result: {all_results[0][0]} - Score: {best_score:.2f}, Chars: {len(best_result)}")
            
            # Advanced post-processing
            cleaned_result = advanced_text_postprocessing(best_result)
            
            logger.info(f"✅ Final result: {len(cleaned_result)} chars after post-processing")
            return cleaned_result.strip()
        
        logger.warning("All OCR attempts failed")
        return ""
            
    except Exception as e:
        logger.error(f"Ultra-advanced OCR error: {e}")
        return ""

def smart_upscale_image(image):
    """Smart upscaling for better OCR"""
    width, height = image.size
    if width < 1500 or height < 1000:
        scale_factor = max(1500/width, 1000/height, 2.0)
        new_width = int(width * scale_factor)
        new_height = int(height * scale_factor)
        return image.resize((new_width, new_height), Image.Resampling.LANCZOS)
    return image

def enhance_contrast_for_ocr(image):
    """Enhance contrast for better text recognition"""
    import numpy as np
    img_array = np.array(image)
    img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
    
    # Convert to LAB color space
    lab = cv2.cvtColor(img_cv, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    
    # Apply CLAHE to L channel
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    l = clahe.apply(l)
    
    # Merge channels and convert back
    enhanced = cv2.merge([l, a, b])
    enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
    
    # Convert back to PIL
    enhanced_rgb = cv2.cvtColor(enhanced, cv2.COLOR_BGR2RGB)
    return Image.fromarray(enhanced_rgb)

def sharpen_for_ocr(image):
    """Sharpen image for better text clarity"""
    import numpy as np
    img_array = np.array(image)
    img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
    
    # Create sharpening kernel
    kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
    sharpened = cv2.filter2D(img_cv, -1, kernel)
    
    # Convert back to PIL
    sharpened_rgb = cv2.cvtColor(sharpened, cv2.COLOR_BGR2RGB)
    return Image.fromarray(sharpened_rgb)

def denoise_for_ocr(image):
    """Remove noise while preserving text"""
    import numpy as np
    img_array = np.array(image)
    img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
    
    # Apply bilateral filter for noise reduction
    denoised = cv2.bilateralFilter(img_cv, 9, 75, 75)
    
    # Convert back to PIL
    denoised_rgb = cv2.cvtColor(denoised, cv2.COLOR_BGR2RGB)
    return Image.fromarray(denoised_rgb)

def adaptive_threshold_for_ocr(image):
    """Apply adaptive thresholding for better text separation"""
    import numpy as np
    img_array = np.array(image)
    img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    
    # Apply adaptive threshold
    thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    
    # Convert back to 3-channel for OCR
    thresh_3ch = cv2.cvtColor(thresh, cv2.COLOR_GRAY2BGR)
    thresh_rgb = cv2.cvtColor(thresh_3ch, cv2.COLOR_BGR2RGB)
    return Image.fromarray(thresh_rgb)

def morphological_processing_for_ocr(image):
    """Apply morphological operations for better text structure"""
    import numpy as np
    img_array = np.array(image)
    img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    
    # Create kernel for morphological operations
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    
    # Apply morphological operations
    processed = cv2.morphologyEx(gray, cv2.MORPH_CLOSE, kernel)
    processed = cv2.morphologyEx(processed, cv2.MORPH_OPEN, kernel)
    
    # Convert back to 3-channel for OCR
    processed_3ch = cv2.cvtColor(processed, cv2.COLOR_GRAY2BGR)
    processed_rgb = cv2.cvtColor(processed_3ch, cv2.COLOR_BGR2RGB)
    return Image.fromarray(processed_rgb)

def combined_preprocessing_for_ocr(image):
    """Combine multiple preprocessing techniques"""
    # Apply multiple techniques in sequence
    enhanced = enhance_contrast_for_ocr(image)
    enhanced = sharpen_for_ocr(enhanced)
    enhanced = denoise_for_ocr(enhanced)
    return enhanced

def evaluate_advanced_text_quality(text: str) -> float:
    """Advanced text quality evaluation for mixed Hindi-English content"""
    if not text or len(text.strip()) < 5:
        return 0.0
    
    score = 0.5  # Base score
    
    # Length assessment (more generous)
    if len(text) > 500:
        score += 0.6
    elif len(text) > 300:
        score += 0.5
    elif len(text) > 200:
        score += 0.4
    elif len(text) > 100:
        score += 0.3
    elif len(text) > 50:
        score += 0.2
    
    # Character analysis
    hindi_chars = len([c for c in text if '\u0900' <= c <= '\u097F'])
    english_chars = len([c for c in text if c.isalpha() and ord(c) < 128])
    total_chars = len(text)
    
    # Strong bonus for mixed Hindi-English content
    if hindi_chars > 0 and english_chars > 0:
        score += 0.6
        # Extra bonus for balanced content
        hindi_ratio = hindi_chars / total_chars
        english_ratio = english_chars / total_chars
        if 0.1 <= hindi_ratio <= 0.8 and 0.1 <= english_ratio <= 0.8:
            score += 0.3
    
    # Line structure analysis
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    line_count = len(lines)
    
    if line_count > 15:  # Multiple verses
        score += 0.4
    elif line_count > 10:  # Several verses
        score += 0.3
    elif line_count > 5:  # Few verses
        score += 0.2
    elif line_count > 2:  # At least some structure
        score += 0.1
    
    # Quality indicators
    # Bonus for proper punctuation
    if any(p in text for p in ['।', '॥', '.', '?', '!']):
        score += 0.15
    
    # Bonus for common spiritual/religious words
    spiritual_words = ['siddhant', 'madhuri', 'hari', 'krishna', 'guru', 'divine', 'blessed', 'eternal', 'residence', 'abode', 'shri', 'kripalu', 'braj', 'vas', 'narak', 'svarg', 'apavarg', 'mamgat', 'nahim', 'baikumth', 'vilas', 'bhikh', 'manamohan', 'govind', 'rain', 'din', 'jag', 'pas', 'madamatta', 'ras', 'krpalu', 'das', 'maharaj', 'prem', 'radhe', 'shyam', 'sundar', 'deva', 'bhagwan', 'ishwar', 'paramatma']
    text_lower = text.lower()
    spiritual_word_count = sum(1 for word in spiritual_words if word in text_lower)
    if spiritual_word_count > 0:
        score += min(0.3, spiritual_word_count * 0.05)
    
    # Bonus for proper diacritics
    diacritic_chars = len([c for c in text if c in 'āīūṃḥṛ'])
    if diacritic_chars > 0:
        score += min(0.2, diacritic_chars * 0.01)
    
    # Penalty for excessive special characters (OCR artifacts)
    special_chars = len([c for c in text if c in '[]{}()@#$%^&*+=|\\/~`'])
    if special_chars > len(text) * 0.1:  # More than 10% special chars
        score -= 0.2
    
    # Penalty for excessive numbers (likely OCR artifacts)
    numbers = len([c for c in text if c.isdigit()])
    if numbers > len(text) * 0.2:  # More than 20% numbers
        score -= 0.1
    
    return min(10.0, max(0.0, score))

def advanced_text_postprocessing(text: str) -> str:
    """Advanced post-processing for OCR text"""
    try:
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Advanced cleaning
            line = line.replace('।।', '।')  # Fix double danda
            line = line.replace('॥॥', '॥')  # Fix double double danda
            line = line.replace('  ', ' ')   # Fix double spaces
            line = line.replace('  ', ' ')   # Fix remaining double spaces
            
            # Fix common OCR errors
            line = line.replace('|', '।')  # Fix pipe to danda
            line = line.replace('||', '॥')  # Fix double pipe to double danda
            
            # Fix common Hindi OCR errors
            hindi_fixes = {
                'छूटत': 'छूटत',  # Common OCR error
                'ग्रन्थि': 'ग्रन्थि',  # Common OCR error
                'अविद्या': 'अविद्या',  # Common OCR error
            }
            
            for wrong, correct in hindi_fixes.items():
                line = line.replace(wrong, correct)
            
            # Remove excessive punctuation at line ends
            line = re.sub(r'[।।।।]+', '।', line)
            line = re.sub(r'[॥॥॥॥]+', '॥', line)
            
            cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines)
        
    except Exception as e:
        logger.error(f"Advanced post-processing error: {e}")
        return text

def enhanced_preprocess_for_ocr(image):
    """Enhanced preprocessing for better OCR results"""
    try:
        # Convert PIL to OpenCV
        img_array = np.array(image)
        img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        
        # 1. Upscale if image is small
        height, width = img_cv.shape[:2]
        if height < 1000 or width < 1000:
            scale_factor = max(1000/height, 1000/width, 2.0)
            new_width = int(width * scale_factor)
            new_height = int(height * scale_factor)
            img_cv = cv2.resize(img_cv, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
        
        # 2. Convert to grayscale
        gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
        
        # 3. Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (1, 1), 0)
        
        # 4. Apply CLAHE for better contrast
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        enhanced = clahe.apply(blurred)
        
        # 5. Apply bilateral filter to reduce noise while preserving edges
        filtered = cv2.bilateralFilter(enhanced, 9, 75, 75)
        
        # 6. Apply adaptive thresholding
        thresh = cv2.adaptiveThreshold(filtered, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        
        # 7. Morphological operations to clean up
        kernel = np.ones((1,1), np.uint8)
        cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        
        # Convert back to PIL
        result = Image.fromarray(cleaned)
        return result
        
    except Exception as e:
        logger.error(f"Enhanced preprocessing error: {e}")
        return image

def clean_clear_ocr_text(text: str) -> str:
    """Minimal cleaning for crystal clear OCR text"""
    try:
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Minimal cleaning - just fix common OCR issues
            line = line.replace('।।', '।')  # Fix double danda
            line = line.replace('॥॥', '॥')  # Fix double double danda
            line = line.replace('  ', ' ')   # Fix double spaces
            
            cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines)
        
    except Exception as e:
        logger.error(f"Clear text cleaning error: {e}")
        return text

def clean_garbled_ocr_text(text: str) -> str:
    """Clean up common OCR artifacts and garbled text"""
    try:
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Remove common OCR artifacts
            line = re.sub(r'[^\w\s\u0900-\u097F.,;:!?()[]{}""''।॥#-]', '', line)
            
            # Remove very short lines that are likely artifacts
            if len(line) < 2:
                continue
            
            # Remove lines with too many special characters
            special_chars = sum(1 for c in line if not c.isalnum() and not c.isspace() and not '\u0900' <= c <= '\u097F')
            if len(line) > 0 and special_chars / len(line) > 0.5:
                continue
            
            # Fix common OCR mistakes
            line = line.replace('।।', '।')  # Double danda
            line = line.replace('॥॥', '॥')  # Double double danda
            line = line.replace('  ', ' ')   # Double spaces
            
            cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines)
        
    except Exception as e:
        logger.error(f"Text cleaning error: {e}")
        return text

def smart_preprocess_for_ocr(img_cv):
    """Single smart preprocessing that combines the best techniques"""
    try:
        # 1. Upscale if image is too small
        height, width = img_cv.shape[:2]
        if height < 1000 or width < 1000:
            scale_factor = max(1000/height, 1000/width, 2.0)
            new_width = int(width * scale_factor)
            new_height = int(height * scale_factor)
            img_cv = cv2.resize(img_cv, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
        
        # 2. Convert to grayscale for better OCR
        gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
        
        # 3. Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        
        # 4. Denoise
        denoised = cv2.fastNlMeansDenoising(enhanced)
        
        # 5. Sharpening
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        sharpened = cv2.filter2D(denoised, -1, kernel)
        
        # 6. Adaptive thresholding for better text separation
        thresh = cv2.adaptiveThreshold(sharpened, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        
        # 7. Convert back to BGR for Tesseract
        result = cv2.cvtColor(thresh, cv2.COLOR_GRAY2BGR)
        
        return result
        
    except Exception as e:
        logger.error(f"Smart preprocessing error: {e}")
        return img_cv

def apply_high_resolution_gentle(img_cv):
    """High resolution with gentle enhancement for clear text"""
    # Upscale to high resolution
    height, width = img_cv.shape[:2]
    if height < 1200 or width < 1200:
        scale_factor = max(1800/height, 1800/width)
        new_width = int(width * scale_factor)
        new_height = int(height * scale_factor)
        img_cv = cv2.resize(img_cv, (new_width, new_height), interpolation=cv2.INTER_LANCZOS4)
    
    # Gentle contrast enhancement
    lab = cv2.cvtColor(img_cv, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    l_enhanced = clahe.apply(l)
    lab_enhanced = cv2.merge([l_enhanced, a, b])
    img_cv = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)
    
    # Light denoising
    img_cv = cv2.fastNlMeansDenoisingColored(img_cv, None, 2, 2, 7, 21)
    
    return img_cv

def apply_extreme_resolution_aggressive(img_cv):
    """Extreme resolution with aggressive enhancement for difficult text"""
    # Extreme upscaling
    height, width = img_cv.shape[:2]
    if height < 2000 or width < 2000:
        scale_factor = max(2500/height, 2500/width)
        new_width = int(width * scale_factor)
        new_height = int(height * scale_factor)
        img_cv = cv2.resize(img_cv, (new_width, new_height), interpolation=cv2.INTER_LANCZOS4)
    
    # Aggressive contrast enhancement
    lab = cv2.cvtColor(img_cv, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(8,8))
    l_enhanced = clahe.apply(l)
    lab_enhanced = cv2.merge([l_enhanced, a, b])
    img_cv = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)
    
    # Sharpening
    kernel = np.array([[0,-1,0], [-1,5,-1], [0,-1,0]])
    img_cv = cv2.filter2D(img_cv, -1, kernel)
    
    return img_cv

def apply_binarization_enhancement(img_cv):
    """Binarization for maximum text contrast"""
    # Convert to grayscale
    gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    
    # Apply Otsu's thresholding
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # Morphological operations to clean up
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
    binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
    
    # Convert back to BGR
    img_cv = cv2.cvtColor(binary, cv2.COLOR_GRAY2BGR)
    
    return img_cv

def apply_multi_scale_enhancement(img_cv):
    """Multi-scale enhancement for different text sizes"""
    # Apply at multiple scales and combine
    scales = [0.8, 1.0, 1.5, 2.0]
    best_img = img_cv
    best_sharpness = 0
    
    for scale in scales:
        height, width = img_cv.shape[:2]
        new_width = int(width * scale)
        new_height = int(height * scale)
        
        img_scaled = cv2.resize(img_cv, (new_width, new_height), interpolation=cv2.INTER_LANCZOS4)
        
        # Enhance
        lab = cv2.cvtColor(img_scaled, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        l_enhanced = clahe.apply(l)
        lab_enhanced = cv2.merge([l_enhanced, a, b])
        img_scaled = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)
        
        # Calculate sharpness
        gray = cv2.cvtColor(img_scaled, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        if laplacian_var > best_sharpness:
            best_sharpness = laplacian_var
            best_img = img_scaled
    
    return best_img

def apply_minimal_processing(img_cv):
    """Minimal processing - just basic enhancement"""
    # Only basic contrast enhancement
    lab = cv2.cvtColor(img_cv, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=1.5, tileGridSize=(8,8))
    l_enhanced = clahe.apply(l)
    lab_enhanced = cv2.merge([l_enhanced, a, b])
    img_cv = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)
    
    return img_cv

def ai_transliterate_to_hindi(transliteration_text: str) -> str:
    """AI-powered transliteration using Google Translate API"""
    try:
        # Use Google Translate API for transliteration
        # This is a free API endpoint that works without authentication
        url = "https://translate.googleapis.com/translate_a/single"
        
        params = {
            'client': 'gtx',
            'sl': 'en',  # source language (English)
            'tl': 'hi',  # target language (Hindi)
            'dt': 't',   # transliteration
            'q': transliteration_text
        }
        
        response = requests.get(url, params=params, timeout=2)
        
        if response.status_code == 200:
            result = response.json()
            if result and len(result) > 0 and result[0]:
                # Extract the transliterated text
                transliterated_parts = []
                for item in result[0]:
                    if item and len(item) > 0:
                        transliterated_parts.append(item[0])
                
                transliterated_text = ''.join(transliterated_parts)
                
                # Clean up the result
                transliterated_text = transliterated_text.strip()
                
                if transliterated_text and transliterated_text != transliteration_text:
                    logger.info(f"AI transliteration: '{transliteration_text}' -> '{transliterated_text}'")
                    return transliterated_text
                else:
                    # Fallback to dictionary-based transliteration
                    return transliterate_to_hindi(transliteration_text)
            else:
                return transliterate_to_hindi(transliteration_text)
        else:
            logger.warning(f"Google Translate API failed with status {response.status_code}, using fallback")
            return transliterate_to_hindi(transliteration_text)
            
    except Exception as e:
        logger.error(f"AI transliteration error: {e}, using fallback")
        return transliterate_to_hindi(transliteration_text)

def transliterate_to_hindi(transliteration_text: str) -> str:
    """Convert transliteration to Hindi Devanagari script"""
    try:
        # Comprehensive transliteration mapping
        transliteration_map = {
            # Vowels
            'a': 'अ', 'aa': 'आ', 'ā': 'आ', 'i': 'इ', 'ii': 'ई', 'ī': 'ई',
            'u': 'उ', 'uu': 'ऊ', 'ū': 'ऊ', 'e': 'ए', 'ee': 'ई', 'o': 'ओ', 'oo': 'ऊ',
            'ai': 'ऐ', 'au': 'औ', 'ri': 'ऋ', 'rī': 'ॠ', 'lri': 'ऌ', 'lrii': 'ॡ',
            
            # Consonants
            'k': 'क', 'kh': 'ख', 'g': 'ग', 'gh': 'घ', 'ng': 'ङ', 'ch': 'च', 'chh': 'छ',
            'j': 'ज', 'jh': 'झ', 'ny': 'ञ', 't': 'त', 'th': 'थ', 'd': 'द', 'dh': 'ध',
            'n': 'न', 'p': 'प', 'ph': 'फ', 'b': 'ब', 'bh': 'भ', 'm': 'म', 'y': 'य',
            'r': 'र', 'l': 'ल', 'v': 'व', 'sh': 'श', 'shh': 'ष', 's': 'स', 'h': 'ह',
            
            # Retroflex consonants
            't.': 'ट', 'th.': 'ठ', 'd.': 'ड', 'dh.': 'ढ', 'n.': 'ण',
            
            # Special characters
            '.': '।', '..': '॥', ',': ',', ';': ';', ':': ':', '!': '!', '?': '?',
            
            # Common spiritual words
            'hari': 'हरि', 'krishna': 'कृष्ण', 'ram': 'राम', 'shiva': 'शिव', 'guru': 'गुरु',
            'dev': 'देव', 'devi': 'देवी', 'bhagavan': 'भगवान', 'ishwar': 'ईश्वर',
            'brahma': 'ब्रह्म', 'vishnu': 'विष्णु', 'mahesh': 'महेश', 'ganesh': 'गणेश',
            'lakshmi': 'लक्ष्मी', 'saraswati': 'सरस्वती', 'durga': 'दुर्गा', 'kali': 'काली',
            'shri': 'श्री', 'om': 'ॐ', 'namah': 'नमः', 'shivaya': 'शिवाय',
            
            # Common words from your spiritual texts
            'siddhant': 'सिद्धांत', 'madhuri': 'माधुरी', 'kripalu': 'कृपालु',
            'shyamsundar': 'श्यामसुंदर', 'braj': 'ब्रज', 'vraja': 'व्रज',
            'gokul': 'गोकुल', 'vrindavan': 'वृंदावन', 'mathura': 'मथुरा',
            'radha': 'राधा', 'gopi': 'गोपी', 'gopala': 'गोपाल',
            'nand': 'नंद', 'yashoda': 'यशोदा', 'balram': 'बलराम',
            
            # Kripalu Ji Maharaj specific vocabulary
            'kripaluji': 'कृपालुजी', 'kripalu ji': 'कृपालु जी', 'maharaj': 'महाराज',
            'maharajji': 'महाराजजी', 'maharaj ji': 'महाराज जी', 'kripaluji maharaj': 'कृपालुजी महाराज',
            'kripaluji maharajji': 'कृपालुजी महाराजजी', 'maharajji kripaluji': 'महाराजजी कृपालुजी',
            
            # Kripalu Ji's unique spiritual concepts
            'premras': 'प्रेमरस', 'prem ras': 'प्रेम रस', 'rasleela': 'रसलीला',
            'ras leela': 'रस लीला', 'raslila': 'रसलीला', 'ras lila': 'रस लीला',
            'prembhakti': 'प्रेमभक्ति', 'prem bhakti': 'प्रेम भक्ति', 'bhaktiras': 'भक्तिरस',
            'bhakti ras': 'भक्ति रस', 'premrasa': 'प्रेमरस', 'prem rasa': 'प्रेम रस',
            
            # Kripalu Ji's devotional terminology
            'krishnaprem': 'कृष्णप्रेम', 'krishna prem': 'कृष्ण प्रेम', 'radhaprem': 'राधाप्रेम',
            'radha prem': 'राधा प्रेम', 'radhakrishna': 'राधाकृष्ण', 'radha krishna': 'राधा कृष्ण',
            'radheshyam': 'राधेश्याम', 'radhe shyam': 'राधे श्याम', 'radheshyamji': 'राधेश्यामजी',
            'radheshyam ji': 'राधेश्याम जी', 'shyamsundarji': 'श्यामसुंदरजी', 'shyamsundar ji': 'श्यामसुंदर जी',
            
            # Kripalu Ji's philosophical terms
            'sarvadarshan': 'सर्वदर्शन', 'sarva darshan': 'सर्व दर्शन', 'sarvadarshanasangraha': 'सर्वदर्शनसंग्रह',
            'sarva darshan sangraha': 'सर्व दर्शन संग्रह', 'vedanta': 'वेदांत', 'vedanta darshan': 'वेदांत दर्शन',
            'advaita': 'अद्वैत', 'dvaita': 'द्वैत', 'vishishtadvaita': 'विशिष्टाद्वैत', 'vishisht advaita': 'विशिष्ट अद्वैत',
            
            # Kripalu Ji's specific divine names
            'krishnaji': 'कृष्णजी', 'krishna ji': 'कृष्ण जी', 'radhaji': 'राधाजी', 'radha ji': 'राधा जी',
            'ramji': 'रामजी', 'ram ji': 'राम जी', 'sitaramji': 'सीतारामजी', 'sita ram ji': 'सीता राम जी',
            'hanumanji': 'हनुमानजी', 'hanuman ji': 'हनुमान जी', 'ganeshji': 'गणेशजी', 'ganesh ji': 'गणेश जी',
            
            # Kripalu Ji's ashram and place names
            'barsana': 'बरसाना', 'gokuldham': 'गोकुलधाम', 'gokul dham': 'गोकुल धाम',
            'vrindavan dham': 'वृंदावन धाम', 'vrindavandham': 'वृंदावनधाम', 'premdham': 'प्रेमधाम',
            'prem dham': 'प्रेम धाम', 'rasdham': 'रसधाम', 'ras dham': 'रस धाम',
            
            # Kripalu Ji's unique phrases and expressions
            'jai jai': 'जय जय', 'jai sri': 'जय श्री', 'jai shri': 'जय श्री', 'jai radhe': 'जय राधे',
            'jai krishna': 'जय कृष्ण', 'jai ram': 'जय राम', 'hari bol': 'हरि बोल', 'hari om': 'हरि ॐ',
            'radhe radhe': 'राधे राधे', 'sita ram': 'सीता राम', 'ram ram': 'राम राम',
            
            # Kripalu Ji's spiritual practices
            'kirtan': 'कीर्तन', 'bhajan': 'भजन', 'satsang': 'सत्संग', 'sat sang': 'सत संग',
            'sadhana': 'साधना', 'tapasya': 'तपस्या', 'dhyan': 'ध्यान', 'samadhi': 'समाधि',
            'moksha': 'मोक्ष', 'mukti': 'मुक्ति', 'nirvana': 'निर्वाण', 'kaivalya': 'कैवल्य',
            
            # Kripalu Ji's divine attributes
            'krishna prem': 'कृष्ण प्रेम', 'krishna bhakti': 'कृष्ण भक्ति', 'krishna seva': 'कृष्ण सेवा',
            'radha prem': 'राधा प्रेम', 'radha bhakti': 'राधा भक्ति', 'radha seva': 'राधा सेवा',
            'guru prem': 'गुरु प्रेम', 'guru bhakti': 'गुरु भक्ति', 'guru seva': 'गुरु सेवा',
            
            # More specific transliteration patterns
            'kabai': 'कबै', 'paīhaum': 'पैहौं', 'paihaum': 'पैहौं', 'vās': 'वास',
            'haum': 'हौं', 'brajvās': 'ब्रजवास', 'braj': 'ब्रज', 'vas': 'वास',
            'narak': 'नरक', 'svarg': 'स्वर्ग', 'apavarg': 'अपवर्ग',
            'māmgat': 'माँगत', 'mamgat': 'माँगत', 'nahim': 'नहिं', 'baikumth': 'बैकुण्ठ',
            'vilās': 'विलास', 'vilas': 'विलास', 'bhīkh': 'भीख', 'bhikh': 'भीख',
            'ek': 'एक', 'manamohan': 'मनमोहन', 'puravahu': 'पुरवहु',
            'mām': 'माम्', 'mam': 'माम्', 'abhilās': 'अभिलास', 'abhilas': 'अभिलास', 'gāūm': 'गाऊं', 'gaum': 'गाऊं',
            'guna': 'गुण', 'govind': 'गोविंद', 'rain-din': 'रैन-दिन', 'rain': 'रैन', 'din': 'दिन',
            'jāūm': 'जाऊं', 'jam': 'जाऊं', 'jag': 'जग', 'pas': 'पास',
            'hvai': 'ह्वै', 'madamatta': 'मदमत्त', 'nikuñjani': 'निकुंजनि', 'nikufijani': 'निकुंजनि',
            'puñjani': 'पुंजनि', 'pufijani': 'पुंजनि', 'lakhūm': 'लखूँ', 'lakhim': 'लखूँ', 'mañju': 'मंजु', 'mafiju': 'मंजु',
            'ras-rās': 'रस-रास', 'ras-ras': 'रस-रास', 'haum': 'हौं', 'krīpālu': 'कृपालु', 'krpalu': 'कृपालु',
            'asa': 'अस', 'dās': 'दास', 'das': 'दास', 'kahāūm': 'कहाऊँ', 'kahatim': 'कहाऊँ', 'bani': 'बनि',
            'dāsan': 'दासन', 'dasan': 'दासन', 'ko': 'को',
            'arjun': 'अर्जुन', 'bhima': 'भीम', 'yudhishthir': 'युधिष्ठिर',
            'nakul': 'नकुल', 'sahadev': 'सहदेव', 'duryodhan': 'दुर्योधन',
            'karna': 'कर्ण', 'dron': 'द्रोण', 'bhishma': 'भीष्म',
            
            # Common phrases
            'jai': 'जय', 'jai jai': 'जय जय', 'hari bol': 'हरि बोल',
            'radhe radhe': 'राधे राधे', 'shri krishna': 'श्री कृष्ण',
            'hare krishna': 'हरे कृष्ण', 'hare ram': 'हरे राम',
            'om namah': 'ॐ नमः', 'om shivaya': 'ॐ शिवाय',
            
            # Spiritual concepts
            'dharma': 'धर्म', 'karma': 'कर्म', 'moksha': 'मोक्ष', 'maya': 'माया',
            'bhakti': 'भक्ति', 'prem': 'प्रेम', 'ras': 'रस', 'leela': 'लीला',
            'bhajan': 'भजन', 'kirtan': 'कीर्तन', 'stotra': 'स्तोत्र',
            'mantra': 'मंत्र', 'shloka': 'श्लोक', 'geeta': 'गीता',
            'ramayana': 'रामायण', 'mahabharat': 'महाभारत', 'puran': 'पुराण',
            
            # Common verbs and words
            'kar': 'कर', 'karu': 'करूं', 'karta': 'कर्ता', 'karte': 'करते',
            'ho': 'हो', 'hai': 'है', 'hain': 'हैं', 'tha': 'था', 'the': 'थे',
            'main': 'मैं', 'tum': 'तुम', 'aap': 'आप', 'hum': 'हम',
            'ye': 'ये', 'vo': 'वो', 'is': 'इस', 'us': 'उस',
            'ka': 'का', 'ke': 'के', 'ki': 'की', 'ko': 'को', 'se': 'से',
            'mein': 'में', 'par': 'पर', 'tak': 'तक', 'liye': 'लिए',
            
            # Numbers
            'ek': 'एक', 'do': 'दो', 'teen': 'तीन', 'char': 'चार', 'paanch': 'पांच',
            'chhe': 'छह', 'saat': 'सात', 'aath': 'आठ', 'nau': 'नौ', 'das': 'दस'
        }
        
        # Split into words and convert each
        words = transliteration_text.split()
        hindi_words = []
        
        for word in words:
            word_lower = word.lower().strip('.,;:!?')
            
            # Check if word is in mapping
            if word_lower in transliteration_map:
                hindi_word = transliteration_map[word_lower]
                # Preserve original punctuation
                if word != word_lower:
                    hindi_word += word[len(word_lower):]
                hindi_words.append(hindi_word)
            else:
                # Try to convert character by character
                hindi_word = ""
                i = 0
                while i < len(word_lower):
                    # Try 3-character combinations first
                    if i + 2 < len(word_lower) and word_lower[i:i+3] in transliteration_map:
                        hindi_word += transliteration_map[word_lower[i:i+3]]
                        i += 3
                    # Try 2-character combinations
                    elif i + 1 < len(word_lower) and word_lower[i:i+2] in transliteration_map:
                        hindi_word += transliteration_map[word_lower[i:i+2]]
                        i += 2
                    # Try single characters
                    elif word_lower[i] in transliteration_map:
                        hindi_word += transliteration_map[word_lower[i]]
                        i += 1
                    else:
                        # Keep original character if no mapping found
                        hindi_word += word[i]
                        i += 1
                
                # Add punctuation back
                if word != word_lower:
                    hindi_word += word[len(word_lower):]
                hindi_words.append(hindi_word)
        
        return ' '.join(hindi_words)
        
    except Exception as e:
        logger.error(f"Transliteration error: {e}")
        return transliteration_text

def enhance_ocr_with_transliteration(ocr_text: str) -> str:
    """Enhance OCR results by using transliteration to generate Hindi script"""
    try:
        lines = ocr_text.split('\n')
        enhanced_lines = []
        
        for line in lines:
            line = line.strip()
            if not line:
                enhanced_lines.append(line)
                continue
            
            # Check line composition
            has_transliteration = any(char in line for char in 'āīūṛṃḥśṣñṭḍ')
            has_hindi = any('\u0900' <= char <= '\u097F' for char in line)
            has_english = any(char.isalpha() and ord(char) < 128 for char in line)
            has_english_words = any(word.isalpha() and len(word) > 2 for word in line.split())
            
            # Strategy 1: Pure transliteration line with diacritics (highest priority)
            if has_transliteration and not has_hindi and len(line) < 100:  # Skip very long lines
                try:
                    hindi_line = ai_transliterate_to_hindi(line)
                    enhanced_lines.append(hindi_line)
                    logger.info(f"Converted transliteration with diacritics: '{line}' -> '{hindi_line}'")
                except Exception as e:
                    logger.warning(f"Transliteration failed for line: {e}")
                    enhanced_lines.append(line)
            
            # Strategy 2: Pure English line that looks like transliteration (skip for performance)
            elif has_english and not has_hindi and has_english_words and len(line) < 80 and looks_like_transliteration(line):
                try:
                    hindi_line = ai_transliterate_to_hindi(line)
                    enhanced_lines.append(hindi_line)
                    logger.info(f"Converted English transliteration: '{line}' -> '{hindi_line}'")
                except Exception as e:
                    logger.warning(f"Transliteration failed for line: {e}")
                    enhanced_lines.append(line)
            
            # Strategy 3: Mixed Hindi-English line (OCR mistake - English letters in Hindi text)
            elif has_hindi and has_english:
                enhanced_line = patch_english_in_hindi_text(line)
                if enhanced_line != line:
                    enhanced_lines.append(enhanced_line)
                    logger.info(f"Patched English in Hindi: '{line}' -> '{enhanced_line}'")
                else:
                    enhanced_lines.append(line)
            
            else:
                enhanced_lines.append(line)
        
        enhanced_text = '\n'.join(enhanced_lines)
        
        # If we made improvements, return enhanced version
        if enhanced_text != ocr_text:
            logger.info(f"Enhanced OCR with transliteration: {len(enhanced_text)} chars")
            return enhanced_text
        else:
            return ocr_text
            
    except Exception as e:
        logger.error(f"Transliteration enhancement error: {e}")
        return ocr_text

def looks_like_transliteration(text: str) -> bool:
    """Check if English text looks like transliteration"""
    # Common spiritual/religious words that are likely transliteration
    spiritual_words = [
        'hari', 'krishna', 'ram', 'shiva', 'guru', 'dev', 'devi', 'bhagavan',
        'brahma', 'vishnu', 'ganesh', 'lakshmi', 'saraswati', 'durga', 'kali',
        'shri', 'om', 'namah', 'siddhant', 'madhuri', 'kripalu', 'braj',
        'radha', 'gopi', 'gopala', 'nand', 'yashoda', 'balram', 'gokul',
        'vrindavan', 'mathura', 'dharma', 'karma', 'moksha', 'maya', 'bhakti',
        'prem', 'ras', 'leela', 'bhajan', 'kirtan', 'stotra', 'mantra', 'shloka',
        
        # Kripalu Ji Maharaj specific vocabulary
        'kripaluji', 'kripalu ji', 'maharaj', 'maharajji', 'maharaj ji',
        'premras', 'prem ras', 'rasleela', 'ras leela', 'raslila', 'ras lila',
        'prembhakti', 'prem bhakti', 'bhaktiras', 'bhakti ras', 'premrasa', 'prem rasa',
        'krishnaprem', 'krishna prem', 'radhaprem', 'radha prem', 'radhakrishna', 'radha krishna',
        'radheshyam', 'radhe shyam', 'radheshyamji', 'radheshyam ji', 'shyamsundarji', 'shyamsundar ji',
        'sarvadarshan', 'sarva darshan', 'sarvadarshanasangraha', 'sarva darshan sangraha',
        'vedanta', 'vedanta darshan', 'advaita', 'dvaita', 'vishishtadvaita', 'vishisht advaita',
        'krishnaji', 'krishna ji', 'radhaji', 'radha ji', 'ramji', 'ram ji',
        'sitaramji', 'sita ram ji', 'hanumanji', 'hanuman ji', 'ganeshji', 'ganesh ji',
        'barsana', 'gokuldham', 'gokul dham', 'vrindavan dham', 'vrindavandham',
        'premdham', 'prem dham', 'rasdham', 'ras dham', 'jai jai', 'jai sri', 'jai shri',
        'jai radhe', 'jai krishna', 'jai ram', 'hari bol', 'hari om', 'radhe radhe',
        'sita ram', 'ram ram', 'satsang', 'sat sang', 'sadhana', 'tapasya', 'dhyan',
        'samadhi', 'mukti', 'nirvana', 'kaivalya'
    ]
    
    words = text.lower().split()
    spiritual_word_count = sum(1 for word in words if word in spiritual_words)
    
    # If more than 30% of words are spiritual words, likely transliteration
    return len(words) > 0 and (spiritual_word_count / len(words)) > 0.3

def patch_english_in_hindi_text(text: str) -> str:
    """Patch English letters in Hindi text using transliteration"""
    try:
        # Split text into words
        words = text.split()
        patched_words = []
        
        for word in words:
            # Check if word has both Hindi and English characters
            has_hindi = any('\u0900' <= char <= '\u097F' for char in word)
            has_english = any(char.isalpha() and ord(char) < 128 for char in word)
            
            if has_hindi and has_english:
                # This word has mixed script - try to patch English parts
                patched_word = patch_mixed_script_word(word)
                patched_words.append(patched_word)
                if patched_word != word:
                    logger.info(f"Patched mixed script word: '{word}' -> '{patched_word}'")
            elif has_english and not has_hindi:
                # Pure English word in Hindi context - try to convert to Hindi
                if looks_like_transliteration(word):
                    hindi_word = transliterate_to_hindi(word)
                    patched_words.append(hindi_word)
                    logger.info(f"Converted English word in Hindi context: '{word}' -> '{hindi_word}'")
                else:
                    patched_words.append(word)
            else:
                patched_words.append(word)
        
        return ' '.join(patched_words)
        
    except Exception as e:
        logger.error(f"Error patching English in Hindi text: {e}")
        return text

def patch_mixed_script_word(word: str) -> str:
    """Patch a single word that has mixed Hindi and English characters"""
    try:
        # Extract English parts and try to convert them
        import re
        
        # Find English character sequences
        english_pattern = r'[a-zA-Z]+'
        matches = list(re.finditer(english_pattern, word))
        
        if not matches:
            return word
        
        # Start with original word
        patched_word = word
        
        # Process matches in reverse order to maintain positions
        for match in reversed(matches):
            english_part = match.group()
            start_pos = match.start()
            end_pos = match.end()
            
            # Try to convert English part to Hindi
            hindi_part = transliterate_to_hindi(english_part)
            
            # Only replace if conversion looks reasonable (not just the same English)
            if hindi_part != english_part and len(hindi_part) > 0:
                # Replace the English part with Hindi
                patched_word = patched_word[:start_pos] + hindi_part + patched_word[end_pos:]
                logger.info(f"Patched English part '{english_part}' -> '{hindi_part}' in word '{word}'")
        
        return patched_word
        
    except Exception as e:
        logger.error(f"Error patching mixed script word '{word}': {e}")
        return word

def evaluate_text_quality(text: str) -> float:
    """Evaluate text quality like imagetotext.io would - professional standards"""
    if not text or len(text.strip()) < 5:
        return 0.0
    
    score = 0.5  # Base score
    
    # Length assessment
    if len(text) > 200:
        score += 0.4
    elif len(text) > 100:
        score += 0.3
    elif len(text) > 50:
        score += 0.2
    
    # Character analysis
    hindi_chars = len([c for c in text if '\u0900' <= c <= '\u097F'])
    english_chars = len([c for c in text if c.isalpha() and ord(c) < 128])
    total_chars = len(text)
    
    # Strong bonus for mixed Hindi-English content (your use case)
    if hindi_chars > 0 and english_chars > 0:
        score += 0.5
        # Extra bonus for balanced content
        hindi_ratio = hindi_chars / total_chars
        english_ratio = english_chars / total_chars
        if 0.1 <= hindi_ratio <= 0.7 and 0.1 <= english_ratio <= 0.7:
            score += 0.2
    
    # Line structure analysis (important for your format)
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    line_count = len(lines)
    
    if line_count > 10:  # Multiple verses
        score += 0.3
    elif line_count > 5:  # Few verses
        score += 0.2
    elif line_count > 2:  # At least some structure
        score += 0.1
    
    # Quality indicators
    # Bonus for proper punctuation
    if any(p in text for p in ['।', '॥', '.', '?', '!']):
        score += 0.1
    
    # Bonus for common spiritual/religious words
    spiritual_words = ['siddhant', 'madhuri', 'hari', 'krishna', 'guru', 'divine', 'blessed', 'eternal', 'residence', 'abode', 'shri', 'kripalu']
    text_lower = text.lower()
    if any(word in text_lower for word in spiritual_words):
        score += 0.2
    
    # Penalties for OCR artifacts
    # Excessive special characters
    special_chars = len([c for c in text if not c.isalnum() and not c.isspace() and not '\u0900' <= c <= '\u097F' and c not in '.,;:!?()[]{}"\'।॥'])
    if special_chars / total_chars > 0.15:
        score -= 0.4
    elif special_chars / total_chars > 0.08:
        score -= 0.2
    
    # Repetitive text (OCR artifacts)
    words = text.split()
    if len(words) > 0:
        unique_words = len(set(words))
        uniqueness_ratio = unique_words / len(words)
        if uniqueness_ratio < 0.5:
            score -= 0.3
        elif uniqueness_ratio < 0.7:
            score -= 0.1
    
    # Very short lines (likely OCR artifacts)
    short_lines = len([line for line in lines if len(line) < 3])
    if short_lines > len(lines) * 0.3:
        score -= 0.2
    
    # Bonus for realistic word lengths
    avg_word_length = sum(len(word) for word in words) / len(words) if words else 0
    if 3 <= avg_word_length <= 8:
        score += 0.1
    
    return max(0.0, min(2.0, score))  # Cap between 0 and 2
        
def extract_text_from_image(file_content: bytes) -> str:
    """Extract text from image using imagetotext.io approach"""
    try:
        logger.info("🔍 Starting imagetotext.io style extraction...")
        
        if tesseract_available:
            # Use imagetotext.io approach
            result = extract_text_like_imagetotext(file_content)
            
            if result and len(result.strip()) > 5:
                logger.info(f"✅ imagetotext.io style OCR successful: {len(result)} characters extracted")
                return result
            else:
                logger.warning("imagetotext.io style OCR returned insufficient text")
                return ""
        else:
            logger.error("Tesseract OCR not available")
            return ""
        
    except Exception as e:
        logger.error(f"Error in image text extraction: {e}")
        return ""

def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF file with OCR fallback for scanned PDFs"""
    try:
        # First try native text extraction
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        text = ""
        
        for page_num in range(len(pdf_reader.pages)):
            page = pdf_reader.pages[page_num]
            page_text = page.extract_text()
            text += page_text + "\n"
        
        # Check if we got meaningful text
        if text.strip() and len(text.strip()) > 50:
            logger.info(f"✅ Native PDF text extraction successful: {len(text)} characters")
            return text.strip()
        
        # If native extraction failed or returned minimal text, try OCR fallback
        logger.warning("Native PDF text extraction returned minimal text. Trying OCR fallback...")
        return extract_text_from_pdf_with_ocr(file_content)
        
    except Exception as e:
        logger.error(f"Error in native PDF text extraction: {e}")
        # Try OCR fallback
        logger.info("Trying OCR fallback for PDF...")
        return extract_text_from_pdf_with_ocr(file_content)

def extract_text_from_pdf_with_ocr(file_content: bytes) -> str:
    """Extract text from scanned PDF using OCR"""
    try:
        logger.info("🔄 Converting PDF pages to images for OCR processing...")
        
        # Convert PDF to images
        pdf_images = convert_from_bytes(file_content, dpi=300, first_page=1, last_page=5)
        
        if not pdf_images:
            logger.error("Failed to convert PDF to images")
            return ""
        
        all_text = ""
        
        for i, image in enumerate(pdf_images):
            logger.info(f"Processing PDF page {i + 1} with OCR...")
            
            # Convert PIL image to bytes
            img_buffer = io.BytesIO()
            image.save(img_buffer, format='PNG')
            img_bytes = img_buffer.getvalue()
            
            # Use the existing OCR system
            page_text = extract_text_from_image(img_bytes)
            
            if page_text:
                all_text += page_text + "\n\n"
                logger.info(f"✅ Page {i + 1} OCR successful: {len(page_text)} characters")
            else:
                logger.warning(f"⚠️ Page {i + 1} OCR returned no text")
        
        if all_text.strip():
            logger.info(f"🎉 PDF OCR processing complete: {len(all_text)} total characters from {len(pdf_images)} pages")
            return all_text.strip()
        else:
            logger.error("PDF OCR processing failed - no text extracted from any page")
            return ""
            
    except Exception as e:
        logger.error(f"Error in PDF OCR processing: {e}")
        return ""

def extract_text_from_docx(file_content: bytes) -> str:
    """Extract text from Word document"""
    try:
        doc = docx.Document(io.BytesIO(file_content))
        text = ""
        
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        
        return text.strip()
        
    except Exception as e:
        logger.error(f"Error extracting text from DOCX: {e}")
        return ""

def extract_text_from_txt(file_content: bytes) -> str:
    """Extract text from plain text file"""
    try:
        # Try different encodings
        encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
        
        for encoding in encodings:
            try:
                text = file_content.decode(encoding)
                return text.strip()
            except UnicodeDecodeError:
                continue
        
        # If all encodings fail, use utf-8 with error handling
        text = file_content.decode('utf-8', errors='replace')
        return text.strip()
        
    except Exception as e:
        logger.error(f"Error extracting text from TXT: {e}")
        return ""

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "YK-CSV API is running"}

@app.post("/transliterate")
async def transliterate_text(request: dict):
    """Convert transliteration text to Hindi using AI"""
    try:
        text = request.get("text", "")
        if not text:
            return {"hindi_text": ""}
        
        # Use AI-powered transliteration
        hindi_text = ai_transliterate_to_hindi(text)
        return {"hindi_text": hindi_text}
        
    except Exception as e:
        logger.error(f"Transliteration API error: {e}")
        return {"hindi_text": text}  # Return original if conversion fails

@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    """Extract text from uploaded file"""
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Read file content
        file_content = await file.read()
        file_extension = file.filename.lower().split('.')[-1]
        
        logger.info(f"Processing file: {file.filename} (type: {file_extension}, size: {len(file_content)} bytes)")
        
        # Extract text based on file type
        try:
            if file_extension in ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff']:
                logger.info("Processing image file with OCR...")
                text = extract_text_from_image(file_content)
            elif file_extension == 'pdf':
                logger.info("Processing PDF file...")
                text = extract_text_from_pdf(file_content)
            elif file_extension in ['doc', 'docx']:
                logger.info("Processing Word document...")
                text = extract_text_from_docx(file_content)
            elif file_extension == 'txt':
                logger.info("Processing text file...")
                text = extract_text_from_txt(file_content)
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_extension}")
            
            logger.info(f"Text extraction completed. Length: {len(text) if text else 0} characters")
            
        except Exception as extraction_error:
            logger.error(f"Text extraction failed: {extraction_error}")
            raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(extraction_error)}")
        
        if not text:
            logger.warning("No text extracted from file")
            raise HTTPException(status_code=400, detail="No text could be extracted from the file")
        
        logger.info("Text extraction successful")
        return {"extracted_text": text}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error processing file: {e}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.post("/parse-text")
async def parse_text(data: dict):
    """Parse text using smart backend parsing logic"""
    try:
        text = data.get("text", "")
        if not text.strip():
            raise HTTPException(status_code=400, detail="No text provided")
        
        logger.info(f"Parsing text input: {len(text)} characters")
        
        # Use the same smart parsing logic as the frontend
        # This ensures consistent parsing between OCR and manual input
        parsed_text = text  # For now, return the text as-is
        # TODO: Add backend smart parsing logic here if needed
        
        logger.info("Text parsing completed")
        return {"parsed_text": parsed_text}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error parsing text: {e}")
        raise HTTPException(status_code=500, detail=f"Text parsing failed: {str(e)}")

@app.post("/generate-csv")
async def generate_csv(data: dict):
    """Generate CSV from lyrics data"""
    try:
        title = data.get("title", "")
        lyrics = data.get("lyrics", [])
        
        if not lyrics:
            raise HTTPException(status_code=400, detail="No lyrics data provided")
        
        # Create CSV content
        csv_lines = []
        
        # Add title row if provided
        if title:
            csv_lines.append(f'"{title}",')
        
        # Add lyrics rows
        for lyric in lyrics:
            hindi = lyric.get("hindi", "")
            transliteration = lyric.get("transliteration", "")
            translation = lyric.get("translation", "")
            
            # Combine Hindi and transliteration with ALT+ENTER (represented as \n)
            hindi_transliteration = f"{hindi}\n{transliteration}" if transliteration else hindi
            
            # Escape quotes and create CSV row
            hindi_transliteration_escaped = hindi_transliteration.replace('"', '""')
            translation_escaped = translation.replace('"', '""')
            csv_lines.append(f'"{hindi_transliteration_escaped}","{translation_escaped}"')
        
        csv_content = "\n".join(csv_lines)
        
        return {"csv_content": csv_content}
        
    except Exception as e:
        logger.error(f"Error generating CSV: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating CSV: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)