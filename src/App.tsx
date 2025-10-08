import React, { useState, useCallback, useEffect } from 'react';
import './index.css';

// Configuration - Frontend-only mode (no backend needed)
const BACKEND_URL = '';  // No backend - pure frontend application

// Declare Google Input Tools API
declare global {
  interface Window {
    google: any;
  }
}

interface LyricLine {
  hindi: string;
  transliteration: string;
  translation: string;
}

// AI-Enhanced parsing function with smart title detection
const parseTextWithTitle = (text: string): { title: string, verses: LyricLine[] } => {
  console.log('=== PARSING TEXT ===');
  console.log('Original text length:', text.length);
  console.log('Original text preview:', text.substring(0, 300) + '...');
  
  // Clean up the text first - preserve newlines
  const cleanedText = text
    .replace(/[^\w\s\u0900-\u097F.,;:!?()[]{}""''।॥#-\n]/g, '') // Remove OCR artifacts but keep newlines
    .replace(/।।/g, '।') // Fix double danda
    .replace(/॥॥/g, '॥') // Fix double double danda
    .replace(/[ \t]+/g, ' ') // Normalize spaces and tabs but keep newlines
    .trim();
  
  console.log('Cleaned text length:', cleanedText.length);
  console.log('Cleaned text preview:', cleanedText.substring(0, 300) + '...');
  
  // Better line splitting - also split on periods and other delimiters
  let lines = cleanedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // If we only have one long line, try to split it intelligently
  if (lines.length === 1 && lines[0].length > 200) {
    console.log('Single long line detected, splitting intelligently...');
    const longLine = lines[0];
    
    // Split on common patterns - more conservative approach
    const patterns = [
      /\n/g,                  // Split on actual newlines first
      /(?<=।)\s*\n/g,         // After danda followed by newline
      /(?<=\.)\s*\n/g,        // After period followed by newline
      /(?<=\|)\s*\n/g,        // After pipe followed by newline
      /\n+(?=[A-Z])/g,        // Multiple newlines before capital letter
      /\n+/g,                 // Multiple newlines
    ];
    
    for (const pattern of patterns) {
      const split = longLine.split(pattern);
      if (split.length > 3) {
        lines = split.map(line => line.trim()).filter(line => line.length > 0);
        console.log(`Split into ${lines.length} lines using pattern`);
        break;
      }
    }
  }
  
  console.log('Total lines after cleaning:', lines.length);
  console.log('First 5 lines:', lines.slice(0, 5));
  
  if (lines.length === 0) return { title: '', verses: [] };

  // AI-Enhanced title detection
  let title = '';
  let startIndex = 0;
  
  // Analyze first few lines with AI-like intelligence
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    console.log(`Line ${i}: "${line.substring(0, 50)}..." - Length: ${line.length}`);
    
    // AI Analysis: Score the line as potential title
    let titleScore = 0;
    let contentScore = 0;
    
    // TITLE INDICATORS (increase titleScore)
    
    // 1. Direct patterns (high confidence)
    if (/Siddhant Madhuri #\d+/.test(line)) {
      titleScore += 20; // Very specific pattern
    } else if (/^[A-Z][a-zA-Z\s]+#\d+$/.test(line)) {
      titleScore += 15; // "Title #123" pattern
    } else if (/^[A-Z][a-zA-Z\s]+\s*#\s*\d+$/.test(line)) {
      titleScore += 15; // "Title # 123" with spaces
    }
    
    // 2. Name patterns (medium confidence)
    if (/^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(line)) {
      titleScore += 8; // "First Last" names
    } else if (/^[A-Z][a-z]+\s+[A-Z][a-z]+\s*#\d+$/.test(line)) {
      titleScore += 12; // "First Last #123"
    }
    
    // 3. Short all-caps phrases (likely titles)
    if (/^[A-Z\s\d#-]+$/.test(line) && line.length <= 40) {
      titleScore += 6;
    }
    
    // 4. Short lines that look like titles
    if (line.length <= 30 && !/[a-z]/.test(line)) {
      titleScore += 4;
    }
    
    // 5. Lines with spiritual/title words
    const titleWords = ['siddhant', 'madhuri', 'bali', 'shri', 'guru', 'kripaal', 'keertan', 'bhajan', 'stotra', 'mantra', 'shloka', 'prem', 'ras', 'bhakti', 'kirtan', 'devotional'];
    if (titleWords.some(word => line.toLowerCase().includes(word)) && line.length <= 50) {
      titleScore += 6;
    }
    
    // 6. Numbered titles (1., 2., etc.)
    if (/^\d+[.)\-\s]/.test(line)) {
      titleScore += 3;
    }
    
    // CONTENT INDICATORS (increase contentScore)
    
    // 1. Pipe-separated content (definitely not title)
    if (line.includes(' | ')) {
      contentScore += 15;
    }
    
    // 2. Contains Hindi characters (likely content)
    if (/[\u0900-\u097F]/.test(line)) {
      contentScore += 10;
    }
    
    // 3. Long lines (likely content)
    if (line.length > 50) {
      contentScore += 8;
    }
    
    // 4. Contains transliteration patterns
    if (/[aeiou][aeiou]/.test(line.toLowerCase()) && line.length > 20) {
      contentScore += 5;
    }
    
    // 5. Contains common content words
    const contentWords = ['the', 'and', 'of', 'to', 'a', 'in', 'is', 'it', 'you', 'that', 'he', 'was', 'for', 'on', 'are', 'when', 'will', 'blessed', 'eternal', 'residence', 'divine', 'abode'];
    if (contentWords.some(word => line.toLowerCase().split(/\s+/).includes(word))) {
      contentScore += 6;
    }
    
    // 6. Contains punctuation typical of content
    if (/[.,;:!?]/.test(line)) {
      contentScore += 4;
    }
    
    // 7. OCR artifacts (likely content, not title)
    if (/[&[\]<>]/.test(line)) {
      contentScore += 3;
    }
    
    // DECISION LOGIC
    console.log(`Line ${i}: "${line}" - Title Score: ${titleScore}, Content Score: ${contentScore}`);
    
    if (contentScore > titleScore) {
      // This looks like content, stop looking for titles
      console.log(`Line ${i}: Stopping title search - content score (${contentScore}) > title score (${titleScore})`);
      break;
    } else if (titleScore > 12) {
      // High confidence title found
      title = line.replace(/^\d+[.-]\s*/, ''); // Remove leading numbers/dashes
      startIndex = i + 1;
      console.log(`Line ${i}: HIGH CONFIDENCE TITLE FOUND: "${title}" (score: ${titleScore})`);
      break;
    } else if (titleScore > 6) {
      // Medium confidence title, but keep looking
      title = line.replace(/^\d+[.-]\s*/, '');
      startIndex = i + 1;
      console.log(`Line ${i}: Medium confidence title: "${title}" (score: ${titleScore})`);
    }
  }
  
  const verseLines = lines.slice(startIndex);
  
  // Intelligent verse parsing based on actual format
  const verses: LyricLine[] = [];
  
  console.log('Processing verse lines:', verseLines.length);
  
  // Try simple 3-line pattern first (Hindi, Transliteration, Translation)
  if (verseLines.length >= 3) {
    console.log('Attempting 3-line pattern parsing...');
    for (let i = 0; i < verseLines.length; i += 3) {
      const hindiLine = verseLines[i]?.trim() || '';
      const transliterationLine = verseLines[i + 1]?.trim() || '';
      const translationLine = verseLines[i + 2]?.trim() || '';
      
      // Check if this looks like a valid 3-line pattern
      const hasHindi = /[\u0900-\u097F]/.test(hindiLine) && hindiLine.length > 5;
      const hasTransliteration = /[a-zA-Z]/.test(transliterationLine) && transliterationLine.length > 5;
      const hasTranslation = /[a-zA-Z]/.test(translationLine) && translationLine.length > 10;
      
      if (hasHindi && hasTransliteration && hasTranslation) {
        console.log(`✅ Found 3-line pattern at line ${i}:`);
        console.log(`  Hindi: "${hindiLine.substring(0, 50)}..."`);
        console.log(`  Transliteration: "${transliterationLine.substring(0, 50)}..."`);
        console.log(`  Translation: "${translationLine.substring(0, 50)}..."`);
        
        verses.push({
          hindi: cleanMixedHindiContent(hindiLine).trim(),
          transliteration: transliterationLine.trim(),
          translation: translationLine.trim()
        });
      }
    }
    
    if (verses.length > 0) {
      console.log(`✅ Successfully parsed ${verses.length} verses using 3-line pattern`);
      return { title, verses };
    }
  }
  
  for (let i = 0; i < verseLines.length; i++) {
    const line = verseLines[i].trim();
    if (!line) continue;
    
    console.log(`Processing line ${i}: "${line.substring(0, 100)}..."`);
    
    // Try to split by pipe character first (Hindi | pattern)
    if (line.includes('|')) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 1) {
        let hindi = parts[0];
        let transliteration = '';
        let translation = '';
        
        // Clean mixed Hindi-English content
        hindi = cleanMixedHindiContent(hindi);
        
        // Smart matching: Look for transliteration and translation in the next line
        if (i + 1 < verseLines.length) {
          const nextLine = verseLines[i + 1].trim();
          const nextLineType = classifyLineType(nextLine);
          
          if (nextLineType === 'mixed') {
            // Extract transliteration and translation from mixed line
            const extracted = extractPartsFromMixedLine(nextLine);
            if (extracted.transliteration) {
              transliteration = enhanceTransliterationWithDiacritics(extracted.transliteration);
            }
            if (extracted.translation) {
              translation = extracted.translation;
            }
            i++; // Skip the next line since we used it
          } else if (nextLineType === 'transliteration') {
            transliteration = nextLine;
            // Enhance transliteration with proper diacritics
            transliteration = enhanceTransliterationWithDiacritics(transliteration);
            i++; // Skip the next line since we used it
          }
        }
        
        // Smart matching: Look for English translation in the next line after transliteration (if not already found)
        if (i + 1 < verseLines.length && !translation) {
          const nextLine = verseLines[i + 1].trim();
          const nextLineType = classifyLineType(nextLine);
          
          if (nextLineType === 'translation') {
            translation = nextLine;
            i++; // Skip the next line since we used it
          }
        }
        
        // Clean up the extracted parts
        hindi = hindi.replace(/[&[\]<>]/g, '').replace(/\s+/g, ' ').trim();
        transliteration = transliteration.replace(/[&[\]<>]/g, '').replace(/\s+/g, ' ').trim();
        translation = translation.replace(/[&[\]<>]/g, '').replace(/\s+/g, ' ').trim();
        
        console.log(`🔍 Parsed parts: Hindi="${hindi}", Transliteration="${transliteration}", Translation="${translation}"`);
        
        // Smart validation before adding verse
        if (isValidVerse(hindi, transliteration, translation)) {
          verses.push({ hindi, transliteration, translation });
          console.log(`✅ Extracted verse ${verses.length}: Hindi="${hindi.substring(0, 40)}...", Transliteration="${transliteration.substring(0, 40)}...", Translation="${translation.substring(0, 40)}..."`);
        } else {
          console.log(`❌ Rejected invalid verse: Hindi="${hindi.substring(0, 30)}...", Transliteration="${transliteration.substring(0, 30)}...", Translation="${translation.substring(0, 30)}..."`);
          console.log(`❌ Validation details: Hindi=${hindi.length}chars, Transliteration=${transliteration.length}chars, Translation=${translation.length}chars`);
        }
      }
    } else {
      // Single line - try to classify it
      const lineType = classifyLineType(line);
      console.log(`Line ${i} classified as: ${lineType}`);
      
        // Smart matching: If it's a Hindi line, look for the next line to be mixed (transliteration + translation)
        if (lineType === 'hindi' && i + 1 < verseLines.length) {
          const nextLine = verseLines[i + 1].trim();
          const nextLineType = classifyLineType(nextLine);
          
          console.log(`🔍 Smart matching: Hindi="${line.substring(0, 30)}...", Next="${nextLineType}"`);
          
          if (nextLineType === 'mixed') {
            // Extract transliteration and translation from mixed line
            const extracted = extractPartsFromMixedLine(nextLine);
            if (extracted.transliteration || extracted.translation) {
              const hindi = cleanMixedHindiContent(line).replace(/[&[\]<>]/g, '').replace(/\s+/g, ' ').trim();
              const transliteration = enhanceTransliterationWithDiacritics(extracted.transliteration).replace(/[&[\]<>]/g, '').replace(/\s+/g, ' ').trim();
              const translation = extracted.translation.replace(/[&[\]<>]/g, '').replace(/\s+/g, ' ').trim();
              
              // Smart validation before adding verse
              if (isValidVerse(hindi, transliteration, translation)) {
                verses.push({ hindi, transliteration, translation });
                console.log(`✅ Smart matched mixed verse ${verses.length}: Hindi="${hindi.substring(0, 30)}...", Transliteration="${transliteration.substring(0, 30)}...", Translation="${translation.substring(0, 30)}..."`);
              } else {
                console.log(`❌ Rejected mixed verse: Hindi="${hindi.substring(0, 30)}...", Transliteration="${transliteration.substring(0, 30)}...", Translation="${translation.substring(0, 30)}..."`);
              }
              i += 1; // Skip the next line
            }
          } else if (nextLineType === 'transliteration' && i + 2 < verseLines.length) {
            // Traditional pattern: Hindi -> Transliteration -> Translation
            const nextLine2 = verseLines[i + 2].trim();
            const nextLine2Type = classifyLineType(nextLine2);
            
            if (nextLine2Type === 'translation') {
              const hindi = line.replace(/[&[\]<>]/g, '').replace(/\s+/g, ' ').trim();
              const transliteration = enhanceTransliterationWithDiacritics(nextLine).replace(/[&[\]<>]/g, '').replace(/\s+/g, ' ').trim();
              const translation = nextLine2.replace(/[&[\]<>]/g, '').replace(/\s+/g, ' ').trim();
              
              verses.push({ hindi, transliteration, translation });
              console.log(`✅ Smart matched traditional verse ${verses.length}: Hindi="${hindi.substring(0, 30)}...", Transliteration="${transliteration.substring(0, 30)}...", Translation="${translation.substring(0, 30)}..."`);
              i += 2; // Skip the next two lines
            } else {
              // Partial match: just Hindi + Transliteration
              const hindi = line.replace(/[&[\]<>]/g, '').replace(/\s+/g, ' ').trim();
              const transliteration = enhanceTransliterationWithDiacritics(nextLine).replace(/[&[\]<>]/g, '').replace(/\s+/g, ' ').trim();
              
              // Try to find translation in subsequent lines (up to 3 lines ahead)
              let translation = '';
              for (let j = i + 2; j < Math.min(i + 5, verseLines.length); j++) {
                const potentialTranslation = verseLines[j].trim();
                const potentialType = classifyLineType(potentialTranslation);
                console.log(`🔍 Looking for translation at line ${j}: "${potentialTranslation.substring(0, 50)}..." - Type: ${potentialType}`);
                
                if (potentialType === 'translation') {
                  translation = potentialTranslation.replace(/[&[\]<>]/g, '').replace(/\s+/g, ' ').trim();
                  i = j; // Skip to the line we used
                  break;
                }
              }
              
              verses.push({ hindi, transliteration, translation });
              console.log(`✅ Enhanced partial matched verse ${verses.length}: Hindi="${hindi.substring(0, 30)}...", Transliteration="${transliteration.substring(0, 30)}...", Translation="${translation.substring(0, 30)}..."`);
              i += 1; // Skip the next line
            }
          }
        }
    }
  }
  
  // Smart verse validation
  function isValidVerse(hindi: string, transliteration: string, translation: string): boolean {
    // Must have at least Hindi or Transliteration
    if (hindi.length < 5 && transliteration.length < 5) {
      return false;
    }
    
    // Hindi should contain Devanagari characters
    if (hindi.length > 0) {
      const devanagariCount = (hindi.match(/[\u0900-\u097F]/g) || []).length;
      if (devanagariCount < 3) {
        return false; // Hindi should have at least 3 Devanagari characters
      }
    }
    
    // Transliteration should not contain Devanagari characters
    if (transliteration.length > 0) {
      const devanagariCount = (transliteration.match(/[\u0900-\u097F]/g) || []).length;
      if (devanagariCount > 0) {
        return false; // Transliteration should not have Hindi characters
      }
    }
    
    // Translation should be in English (no Devanagari, reasonable length)
    if (translation.length > 0) {
      const devanagariCount = (translation.match(/[\u0900-\u097F]/g) || []).length;
      if (devanagariCount > 0) {
        return false; // Translation should not have Hindi characters
      }
      if (translation.length < 10) {
        return false; // Translation should be at least 10 characters
      }
    }
    
    // Avoid duplicates (simple check)
    for (const existingVerse of verses) {
      if (existingVerse.hindi === hindi && existingVerse.transliteration === transliteration) {
        return false; // Avoid exact duplicates
      }
    }
    
    return true;
  }

  // Clean mixed Hindi-English content
  function cleanMixedHindiContent(text: string): string {
    // Remove English words that are OCR artifacts
    const cleaned = text
      .replace(/\b(of|teat|Gere)\b/g, '') // Remove OCR artifacts
      .replace(/\b[a-zA-Z]{1,3}\b/g, '') // Remove short English words (likely OCR errors)
      .replace(/\s+/g, ' ') // Clean up multiple spaces
      .trim();
    
    console.log(`🧹 Cleaned mixed content: "${text}" → "${cleaned}"`);
    return cleaned;
  }

  // Helper functions for enhanced parsing
  function enhanceTransliterationWithDiacritics(text: string): string {
    // Common diacritic mappings for Kripalu Ji Maharaj's vocabulary
    const diacriticMap: { [key: string]: string } = {
      // Long vowels
      'hari': 'harī',
      'hari,': 'harī,',
      'kabai': 'kabai',
      'haum': 'haum',
      'paihaum': 'paihaum',
      'braj': 'braj',
      'vas': 'vās',
      'narak': 'narak',
      'svarg': 'svarg',
      'apavarg': 'apavarg',
      'mamgat': 'māṃgat',
      'nahim': 'nahiṃ',
      'baikumth': 'baikunṭh',
      'vilas': 'vilās',
      'bhikh': 'bhīkh',
      'manamohan': 'manamohan',
      'puravahu': 'puravahu',
      'mam': 'mam',
      'abhilas': 'abhilāṣ',
      'gaum': 'gāūṃ',
      'guna': 'guṇa',
      'govind': 'govind',
      'rain': 'rain',
      'jam': 'jāūṃ',
      'jag': 'jag',
      'pas': 'pās',
      'hvai': 'hvai',
      'madamatta': 'madamatta',
      'nikufijani': 'nikuṃjani',
      'pufijani': 'puṃjani',
      'lakhim': 'lakhūṃ',
      'mafiju': 'mañju',
      'ras': 'ras',
      'rās': 'rās',
      'krpalu': 'kṛpālu',
      'asa': 'asa',
      'das': 'dās',
      'kahatim': 'kahatīṃ',
      'bani': 'bani',
      'dasan': 'dāsan',
      'ko': 'ko',
      'ke': 'ke',
      'ki': 'kī',
      'ka': 'kā',
      'me': 'me',
      'se': 'se',
      'par': 'par',
      'ne': 'ne',
      'ta': 'tā',
      'te': 'te'
    };

    let enhanced = text;
    
    // Apply diacritic mappings
    Object.entries(diacriticMap).forEach(([plain, withDiacritics]) => {
      const regex = new RegExp(`\\b${plain}\\b`, 'gi');
      enhanced = enhanced.replace(regex, withDiacritics);
    });

    return enhanced;
  }

  function classifyLineType(line: string): 'hindi' | 'transliteration' | 'translation' | 'mixed' {
    const cleanLine = line.replace(/[^\w\s\u0900-\u097F.,;:!?()[]{}""''।॥#-]/g, '').trim();
    
    if (cleanLine.length === 0) return 'mixed';
    
    const hindiChars = (cleanLine.match(/[\u0900-\u097F]/g) || []).length;
    const englishChars = (cleanLine.match(/[a-zA-Z]/g) || []).length;
    const totalChars = cleanLine.length;
    
    const hindiRatio = hindiChars / totalChars;
    const englishRatio = englishChars / totalChars;
    
    // Smart Hindi detection: Devanagari characters with proper ratios
    if (hindiRatio > 0.3 && hindiChars > 3) {
      return 'hindi';
    }
    
    // Check for mixed transliteration + translation format
    if (englishRatio > 0.7 && hindiChars === 0 && totalChars > 20) {
      // Look for pattern: "transliteration text" English translation
      const hasQuotes = /^".*" /.test(cleanLine) || /".*"$/.test(cleanLine);
      const hasCommaSeparation = /,\s*[A-Z]/.test(cleanLine);
      const hasMultipleSentences = cleanLine.split(/[.!?]/).length > 1;
      const hasTransliterationPattern = /(shri|krishna|guru|dev|hindu|bhagavan|ram|shyam|radha|gopal|madhuri|kripalu|prem|ras|bhakti|dharma|moksha|satsang|bhajan|kirtan|puja|mandir|ashram|swami|maharaj|ji|bali|divya|vachan|suni|chhutat|granthi|avidyaa|jaal|varad|hast|sanmukh|chal|kalikaal|banat|bigaari|sakat|nahim|maayaashakti|gupaal|yugal|charan|parasat|man|paavat|rati|nandlaal|lakhat|anugrah|leela|laarali)/i.test(cleanLine);
      
      if (hasQuotes || hasCommaSeparation || hasMultipleSentences || hasTransliterationPattern) {
        return 'mixed';
      }
    }
    
    // Smart Translation detection: English sentences with proper structure
    if (englishRatio > 0.7 && cleanLine.length > 15) {
      const words = cleanLine.split(/\s+/);
      const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
      const hasProperWords = words.length > 3 && avgWordLength > 3.0;
      const startsWithCapital = /^[A-Z]/.test(cleanLine);
      // const hasProperEnding = /[.!?]$/.test(cleanLine);
      
      // Strong indicators of English translation (more lenient)
      if (hasProperWords && startsWithCapital) {
        return 'translation';
      }
      
      // Also accept if it's a long sentence even without proper ending
      if (words.length > 8 && avgWordLength > 3.5) {
        return 'translation';
      }
    }
    
    // Smart Transliteration detection: Roman script with Sanskrit/Hindi patterns
    if (englishRatio > 0.5 && cleanLine.length > 8 && hindiRatio === 0) {
      const transliterationWords = [
        'hari', 'krishna', 'ram', 'braj', 'vas', 'narak', 'svarg', 'mamgat', 'nahim', 
        'bhikh', 'manamohan', 'govind', 'rain', 'din', 'jag', 'pas', 'madamatta', 
        'ras', 'krpalu', 'das', 'kripalu', 'maharaj', 'prem', 'madhuri', 'radhe', 
        'shyam', 'sundar', 'guru', 'deva', 'bhagwan', 'ishwar', 'paramatma',
        'siddhant', 'madhuri', 'shyamsundar', 'baikunth', 'apavarg', 'bhikh',
        'abhilas', 'nikunjani', 'yugal', 'charan', 'parasat', 'paavat', 'rati',
        'nandlaal', 'anugrah', 'leela', 'laarali', 'laal', 'kabai', 'haum', 'paihaum',
        'braj', 'vas', 'narak', 'svarg', 'apavarg', 'mamgat', 'baikumth', 'vilas',
        'mamgat', 'bhikh', 'ek', 'manamohan', 'puravahu', 'mam', 'abhilas',
        'gaum', 'guna', 'govind', 'rain-din', 'jam', 'nahim', 'jag', 'pas',
        'hvai', 'madamatta', 'nikufijani', 'pufijani', 'lakhim', 'mafiju', 'ras-ras',
        'haum', 'krpalu', 'asa', 'das', 'kahatim', 'bani', 'dasan', 'ko', 'das'
      ];
      
      const hasTransliterationWords = transliterationWords.some(word => 
        cleanLine.toLowerCase().includes(word.toLowerCase())
      );
      
      // Additional transliteration patterns
      const hasTransliterationPatterns = /[āīūṃḥṛ]/i.test(cleanLine) || // Has diacritics
        (/\b[a-z]+(?:[ai]|aa|ee|oo|am|ah|ri)\b/i.test(cleanLine)) || // Sanskrit endings
        (/^[a-z]/.test(cleanLine) && cleanLine.length > 10 && cleanLine.length < 100); // Proper length
      
      if (hasTransliterationWords || hasTransliterationPatterns) {
        return 'transliteration';
      }
    }
    
    return 'mixed';
  }
  
  // function cleanLine(line: string): string {
  //   return line
  //     .replace(/[^\w\s\u0900-\u097F.,;:!?()[]{}""''।॥#-]/g, '')
  //     .replace(/\s+/g, ' ')
  //     .trim();
  // }
  
  function extractPartsFromMixedLine(line: string): { hindi: string, transliteration: string, translation: string } {
    const cleanLine = line.replace(/[^\w\s\u0900-\u097F.,;:!?()[]{}""''।॥#-]/g, '').trim();
    
    // Try different separation patterns for the format: "transliteration text" English translation
    const patterns = [
      /^"(.+?)"\s*([A-Z].+)$/,             // "transliteration" English translation
      /^(.+?),\s*([A-Z].+)$/,              // transliteration, English translation
      /^(.+?)\s*\.\s*([A-Z].+)$/,          // transliteration. English translation
      /^(.+?)\s*-\s*([A-Z].+)$/,           // transliteration - English translation
      /^(.+?)\s*:\s*([A-Z].+)$/,           // transliteration: English translation
      /^(.+?)\s+(I\s+[a-z].+)$/,           // transliteration I translation
      /^(.+?)\s+(By\s+[a-z].+)$/,          // transliteration By translation
      /^(.+?)\s+(Says\s+[a-z].+)$/,        // transliteration Says translation
      /^(.+?)\s+(May\s+[a-z].+)$/,         // transliteration May translation
      /^(.+?)\s+(Blessed\s+[a-z].+)$/,     // transliteration Blessed translation
      /^(.+?)\s+(Divine\s+[a-z].+)$/,      // transliteration Divine translation
      /^(.+?)\s+(God's\s+[a-z].+)$/,       // transliteration God's translation
      /^(.+?)\s+(I have\s+[a-z].+)$/,      // transliteration I have translation
      /^(.+?)\s+(I desire\s+[a-z].+)$/,    // transliteration I desire translation
      /^(.+?)\s+(I ask\s+[a-z].+)$/,       // transliteration I ask translation
      /^(.+?)\s+(Task only\s+[a-z].+)$/,   // transliteration Task only translation
      /^(.+?)\s+(O Shyamsundar!\s+[a-z].+)$/ // transliteration O Shyamsundar! translation
    ];
    
    for (const pattern of patterns) {
      const match = cleanLine.match(pattern);
      if (match && match.length >= 3) {
        const transliterationPart = match[1].replace(/"/g, '').trim();
        const translationPart = match[2].trim();
        
        // Validate that transliteration part looks like transliteration
        const hasTransliterationWords = /(shri|krishna|guru|dev|hindu|bhagavan|ram|shyam|radha|gopal|madhuri|kripalu|prem|ras|bhakti|dharma|moksha|satsang|bhajan|kirtan|puja|mandir|ashram|swami|maharaj|ji|bali|divya|vachan|suni|chhutat|granthi|avidyaa|jaal|varad|hast|sanmukh|chal|kalikaal|banat|bigaari|sakat|nahim|maayaashakti|gupaal|yugal|charan|parasat|man|paavat|rati|nandlaal|lakhat|anugrah|leela|laarali)/i.test(transliterationPart);
        
        if (hasTransliterationWords || transliterationPart.length < 50) {
          return {
            hindi: '',
            transliteration: transliterationPart,
            translation: translationPart
          };
        }
      }
    }
    
    
    // Try to split by common separators (original logic)
    const parts = cleanLine.split(/[|]/);
    
    if (parts.length >= 3) {
      return {
        hindi: parts[0].trim(),
        transliteration: parts[1].trim(),
        translation: parts[2].trim()
      };
    }
    
    // If no clear separation, classify the whole line
    const type = classifyLineType(cleanLine);
    const result = { hindi: '', transliteration: '', translation: '' };
    
    switch (type) {
      case 'hindi':
        result.hindi = cleanLine;
        break;
      case 'transliteration':
        result.transliteration = cleanLine;
        break;
      case 'translation':
        result.translation = cleanLine;
        break;
      default:
        // Default to Hindi if unclear
        result.hindi = cleanLine;
    }
    
    return result;
  }

  console.log(`🎯 FINAL RESULT - Title: "${title}", Verses: ${verses.length}`);
  console.log('Final verses:', verses);
  
  return { title, verses };
};

const App: React.FC = () => {
  const [extractedText, setExtractedText] = useState<string>('');
  const [lyrics, setLyrics] = useState<LyricLine[]>([
    { hindi: '', transliteration: '', translation: '' }
  ]);
  const [title, setTitle] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [textInput, setTextInput] = useState<string>('');

  // Debug input mode changes
  useEffect(() => {
    console.log('Input mode changed to:', inputMode);
  }, [inputMode]);

  // Auto-resize textarea function
  const updateLyric = useCallback((index: number, field: keyof LyricLine, value: string) => {
    setLyrics(prev => prev.map((lyric, i) => 
      i === index ? { ...lyric, [field]: value } : lyric
    ));
  }, []);

  const autoResizeTextarea = useCallback((textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  }, []);

  // Handle textarea input with auto-resize
  const handleTextareaInput = useCallback((event: React.FormEvent<HTMLTextAreaElement>, index: number, field: keyof LyricLine) => {
    const textarea = event.currentTarget;
    autoResizeTextarea(textarea);
    updateLyric(index, field, textarea.value);
  }, [autoResizeTextarea, updateLyric]);

  // Advanced Google Input Tool-like system
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentWord, setCurrentWord] = useState('');
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [isConverting, setIsConverting] = useState(false);
  const [lastWordPosition, setLastWordPosition] = useState({ start: 0, end: 0 });

  // Debounced suggestion fetching
  const [suggestionTimeout, setSuggestionTimeout] = useState<NodeJS.Timeout | null>(null);

  // Handle Hindi input with advanced Google Input Tool behavior
  const handleHindiInput = useCallback((event: React.FormEvent<HTMLTextAreaElement>, index: number) => {
    const textarea = event.currentTarget;
    const value = textarea.value;
    const cursorPos = textarea.selectionStart;
    
    // Auto-resize
    autoResizeTextarea(textarea);
    
    // Update the lyric
    updateLyric(index, 'hindi', value);
    
    // Find the current word being typed (more sophisticated)
    const wordInfo = getCurrentWordInfo(value, cursorPos);
    const currentWord = wordInfo.word;
    
    setCurrentWord(currentWord);
    setLastWordPosition({ start: wordInfo.start, end: wordInfo.end });
    
    // Clear previous timeout
    if (suggestionTimeout) {
      clearTimeout(suggestionTimeout);
    }
    
    // Get suggestions with debouncing (like Google Input Tool)
    if (currentWord.length >= 1 && !isConverting) {
      const timeout = setTimeout(() => {
        getAdvancedSuggestions(currentWord).then(sugs => {
          setSuggestions(sugs);
          setShowSuggestions(sugs.length > 0 && currentWord.length > 0);
          setSelectedSuggestionIndex(0);
        });
      }, 150); // Debounce for 150ms like Google
      
      setSuggestionTimeout(timeout);
    } else if (currentWord.length === 0) {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [autoResizeTextarea, updateLyric, suggestionTimeout, isConverting]);

  // Get current word information (start, end, word)
  const getCurrentWordInfo = (text: string, cursorPos: number) => {
    // Find word boundaries more intelligently
    let start = cursorPos;
    let end = cursorPos;
    
    // Move start backwards to find word beginning
    while (start > 0 && /\S/.test(text[start - 1])) {
      start--;
    }
    
    // Move end forwards to find word ending
    while (end < text.length && /\S/.test(text[end])) {
      end++;
    }
    
    const word = text.substring(start, end);
    
    return { start, end, word };
  };

  // Get advanced suggestions (like Google Input Tool)
  const getAdvancedSuggestions = async (word: string): Promise<string[]> => {
    const suggestions: string[] = [];
    
    try {
      // Get backend suggestion
      const response = await fetch('/api/transliterate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: word })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.hindi_text) {
          suggestions.push(data.hindi_text);
        }
      }
    } catch (error) {
      console.log('Backend suggestion error:', error);
    }
    
    // Add comprehensive fallback suggestions
    const fallbackSuggestions = getComprehensiveSuggestions(word);
    suggestions.push(...fallbackSuggestions);
    
    // Remove duplicates and return top suggestions
    const uniqueSuggestions = [...new Set(suggestions)];
    return uniqueSuggestions.slice(0, 5); // Return top 5 like Google
  };

  // Roman to Hindi script conversion (not translation)
  const getComprehensiveSuggestions = (word: string): string[] => {
    const romanToHindiMap: { [key: string]: string[] } = {
      // Basic Roman to Hindi script conversion
      'hari': ['हरि', 'हरी', 'हारी'],
      'krishna': ['कृष्ण', 'कृष्णा', 'कृष्णः'],
      'ram': ['राम', 'रामः', 'रामा'],
      'braj': ['ब्रज', 'ब्रजा', 'व्रज'],
      'vas': ['वास', 'वस', 'वसः'],
      'narak': ['नरक', 'नारक', 'नरकः'],
      'svarg': ['स्वर्ग', 'स्वर्गः', 'स्वर्गा'],
      'apavarg': ['अपवर्ग', 'अपवर्गः'],
      'mamgat': ['माँगत', 'मंगत', 'मांगत'],
      'nahim': ['नहिं', 'नहीं', 'नहि'],
      'bhikh': ['भीख', 'भिक्षा', 'भीखा'],
      'manamohan': ['मनमोहन', 'मन-मोहन', 'मनमोहनः'],
      'govind': ['गोविंद', 'गोविन्द', 'गोविंदः'],
      'rain': ['रैन', 'रैण', 'रैनः'],
      'din': ['दिन', 'दीन', 'दिनः'],
      'jag': ['जग', 'जगत', 'जगः'],
      'pas': ['पास', 'पाश', 'पासः'],
      'ras': ['रस', 'रसः', 'रसा'],
      'krpalu': ['कृपालु', 'कृपालुः'],
      'das': ['दास', 'दासः', 'दासा'],
      'kripalu': ['कृपालु', 'कृपालुः'],
      'maharaj': ['महाराज', 'महाराजः', 'महाराजा'],
      'prem': ['प्रेम', 'प्रेमः', 'प्रेमा'],
      'madhuri': ['माधुरी', 'माधुरीः', 'मधुरी'],
      'radhe': ['राधे', 'राधा', 'राधेः'],
      'shyam': ['श्याम', 'श्यामः', 'श्यामा'],
      'sundar': ['सुंदर', 'सुन्दर', 'सुंदरः'],
      'guru': ['गुरु', 'गुरुः', 'गुरुः'],
      'deva': ['देव', 'देवः', 'देवा'],
      'bhagwan': ['भगवान', 'भगवानः', 'भगवान्'],
      'ishwar': ['ईश्वर', 'ईश्वरः', 'ईश्वरा'],
      'paramatma': ['परमात्मा', 'परमात्मः'],
      'siddhant': ['सिद्धांत', 'सिद्धान्त', 'सिद्धांतः'],
      'baikunth': ['बैकुंठ', 'वैकुंठ', 'बैकुंठः'],
      'abhilas': ['अभिलास', 'अभिलाष', 'अभिलासः'],
      'nikunjani': ['निकुंजनी', 'निकुंजनि', 'निकुंजनीः'],
      
      // Common Roman to Hindi script patterns
      'shri': ['श्री', 'श्रीः'],
      'om': ['ओम', 'ॐ', 'ओं'],
      'namah': ['नमः', 'नमह'],
      'namo': ['नमो', 'नमोः'],
      'jai': ['जय', 'जयः', 'जया'],
      'shiv': ['शिव', 'शिवः', 'शिवा'],
      'vishnu': ['विष्णु', 'विष्णुः'],
      'brahma': ['ब्रह्मा', 'ब्रह्मः'],
      'ganesh': ['गणेश', 'गणेशः', 'गणेशा'],
      'hanuman': ['हनुमान', 'हनुमानः', 'हनुमान्'],
      
      // Additional Roman to Hindi script mappings
      'kabai': ['कबै', 'कबई'],
      'haum': ['हाउम', 'हौम'],
      'paihaum': ['पाहुम', 'पैहौम'],
      'vilas': ['विलास', 'विलासः'],
      'puravahu': ['पुरवाहु', 'पुरावाहु'],
      'mam': ['मम', 'माम्'],
      'gaum': ['गाऊँ', 'गौं'],
      'guna': ['गुन', 'गुण'],
      'hvai': ['ह्वै', 'ह्वैः'],
      'madamatta': ['मदमत्त', 'मदमत्तः'],
      'pufijani': ['पुफिजानी', 'पुफिजानि'],
      'lakhim': ['लखिम', 'लक्ष्मी'],
      'mafiju': ['मफिजु', 'मफिजुः'],
      'asa': ['अस', 'असः'],
      'kahatim': ['कहतिम', 'कहतिमः'],
      'bani': ['बनि', 'बनी'],
      'dasan': ['दासन', 'दासनः']
    };

    const suggestions: string[] = [];
    const lowerWord = word.toLowerCase();
    
    // Direct match with all variations
    if (romanToHindiMap[lowerWord]) {
      suggestions.push(...romanToHindiMap[lowerWord]);
    }
    
    // Partial matches (prefix matching)
    Object.keys(romanToHindiMap).forEach(key => {
      if (key.startsWith(lowerWord) && lowerWord.length >= 2) {
        suggestions.push(...romanToHindiMap[key]);
      }
    });
    
    // Fuzzy matching for common typos
    if (lowerWord.length >= 3) {
      Object.keys(romanToHindiMap).forEach(key => {
        if (Math.abs(key.length - lowerWord.length) <= 1) {
          const similarity = calculateSimilarity(key, lowerWord);
          if (similarity > 0.7) {
            suggestions.push(...romanToHindiMap[key]);
          }
        }
      });
    }
    
    // Remove duplicates and return
    const uniqueSuggestions = [...new Set(suggestions)];
    return uniqueSuggestions.slice(0, 5);
  };

  // Calculate string similarity for fuzzy matching
  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  };

  // Levenshtein distance calculation
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  // Advanced keyboard handler like Google Input Tool
  const handleHindiKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>, index: number) => {
    const textarea = event.currentTarget;
    
    if (showSuggestions && suggestions.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      } else if (event.key === 'Enter') {
        event.preventDefault();
        acceptSuggestion(suggestions[selectedSuggestionIndex], textarea, index); // Convert word and accept suggestion
      } else if (event.key === ' ') {
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setShowSuggestions(false);
        setSuggestions([]);
        setSelectedSuggestionIndex(0);
      } else if (event.key === 'Tab') {
        event.preventDefault();
        acceptSuggestion(suggestions[selectedSuggestionIndex], textarea, index);
      }
    } else {
      // Handle normal typing when no suggestions
      if (event.key === ' ' || event.key === 'Enter') {
        // Convert last word if it looks like transliteration
        const value = textarea.value;
        const cursorPos = textarea.selectionStart;
        const wordInfo = getCurrentWordInfo(value, cursorPos - 1);
        
        if (wordInfo.word.length > 2 && isLikelyTransliteration(wordInfo.word)) {
          event.preventDefault();
          const suggestions = getComprehensiveSuggestions(wordInfo.word);
          if (suggestions.length > 0) {
            acceptSuggestion(suggestions[0], textarea, index);
          }
        }
      }
    }
  }, [showSuggestions, suggestions, selectedSuggestionIndex, updateLyric, autoResizeTextarea]);

  // Accept suggestion and update text
  const acceptSuggestion = (suggestion: string, textarea: HTMLTextAreaElement, index: number, appendChar?: string) => {
    setIsConverting(true);
    
    const value = textarea.value;
    const { start, end } = lastWordPosition;
    
    // Replace the word with suggestion and optionally append a character
    const newValue = value.substring(0, start) + suggestion + (appendChar || '') + value.substring(end);
    
    // Update textarea
    textarea.value = newValue;
    updateLyric(index, 'hindi', newValue);
    
    // Hide suggestions
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestionIndex(0);
    
    // Auto-resize
    autoResizeTextarea(textarea);
    
    // Move cursor to end of suggestion (including appended character)
    const newCursorPos = start + suggestion.length + (appendChar ? appendChar.length : 0);
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    
    // Reset conversion state
    setTimeout(() => setIsConverting(false), 100);
  };

  // Check if word is likely transliteration
  const isLikelyTransliteration = (word: string): boolean => {
    // Check if word contains mostly English characters and common transliteration patterns
    const englishChars = /[a-zA-Z]/g;
    const englishMatches = word.match(englishChars) || [];
    const englishRatio = englishMatches.length / word.length;
    
    // Common transliteration patterns
    const transliterationPatterns = [
      /^[a-z]+$/i, // All lowercase letters
      /[aeiou]/i,  // Contains vowels
      /[kgcdjtpb]/i, // Contains common Hindi consonants
      /(aa|ee|ii|oo|uu|ai|au)/i, // Common vowel combinations
      /(sh|ch|th|dh|bh|gh|kh|ph)/i // Common consonant combinations
    ];
    
    return englishRatio > 0.7 && transliterationPatterns.some(pattern => pattern.test(word));
  };


  // Handle transliteration input - NO conversion to Hindi field
  const handleTransliterationInput = useCallback((event: React.FormEvent<HTMLTextAreaElement>, index: number) => {
    const textarea = event.currentTarget;
    const value = textarea.value;
    
    // Auto-resize
    autoResizeTextarea(textarea);
    
    // Update transliteration field ONLY - do NOT affect Hindi field
    updateLyric(index, 'transliteration', value);
  }, [autoResizeTextarea, updateLyric]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  // UNIFIED PROCESSING - Both OCR and text input follow the same process
  const makeLyricsFromText = useCallback((text: string) => {
    const { title: parsedTitle, verses } = parseTextWithTitle(text);
    setTitle(parsedTitle);
    setLyrics(verses.length > 0 ? verses : [{ hindi: '', transliteration: '', translation: '' }]);
  }, []);

  // OCR FUNCTIONS - Extract text from files, then make lyrics
  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    const files = Array.from(event.dataTransfer.files);
    
    if (files.length === 0) return;
    
    await processFileWithOCR(files[0]);
  }, []);

  const handleFileInput = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    await processFileWithOCR(files[0]);
  }, []);

  const processFileWithOCR = useCallback(async (file: File) => {
    setIsProcessing(true);
    
    try {
      // Convert file to base64 for OCR processing
      const reader = new FileReader();
      const imageData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const response = await fetch('/api/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageData: imageData,
          fileName: file.name,
          fileType: file.type
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to extract text from file');
      }
      
      const result = await response.json();
      setExtractedText(result.extracted_text);
      
      // OCR extracted text → Make lyrics
      makeLyricsFromText(result.extracted_text);
      
    } catch (error) {
      console.error('OCR Error:', error);
      alert(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  }, [makeLyricsFromText]);

  // TEXT FUNCTIONS - Process text directly, then make lyrics
  const handleTextInput = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(event.target.value);
  }, []);

  const parseTextInput = useCallback(() => {
    if (!textInput.trim()) {
      alert('Please enter some text first!');
      return;
    }
    
    setExtractedText(textInput);
    
    // Text input → Make lyrics directly
    makeLyricsFromText(textInput);
  }, [textInput, makeLyricsFromText]);

  const addLyric = useCallback(() => {
    setLyrics(prev => [...prev, { hindi: '', transliteration: '', translation: '' }]);
  }, []);

  const removeLyric = useCallback((index: number) => {
    setLyrics(prev => prev.filter((_, i) => i !== index));
  }, []);

  const generateCSV = useCallback(() => {
    const csvData = [];
    
    // Add title row if exists
    if (title.trim()) {
      csvData.push([title, '']);
    }
    
    // Add verses
    lyrics.forEach(lyric => {
      if (lyric.hindi.trim() || lyric.transliteration.trim() || lyric.translation.trim()) {
        const hindiWithTransliteration = lyric.hindi.trim() + 
          (lyric.transliteration.trim() ? '\n' + lyric.transliteration.trim() : '');
        csvData.push([hindiWithTransliteration, lyric.translation.trim()]);
      }
    });
    
    const csvContent = csvData.map(row => 
      `"${row[0].replace(/"/g, '""')}","${row[1].replace(/"/g, '""')}"`
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'lyrics.csv';
    link.click();
  }, [title, lyrics]);

  const clearAll = useCallback(() => {
    setExtractedText('');
    setLyrics([{ hindi: '', transliteration: '', translation: '' }]);
    setTitle('');
    setTextInput('');
  }, []);

  // Auto-resize all textareas when component mounts or lyrics change
  useEffect(() => {
    const textareas = document.querySelectorAll('.lyric-input');
    textareas.forEach((textarea) => {
      autoResizeTextarea(textarea as HTMLTextAreaElement);
    });
  }, [lyrics, autoResizeTextarea]);

  return (
    <div className="container">
      <div className="header">
        <h1>YK-CSV</h1>
        <p>Upload files or paste text to create CSV lyrics for VMix</p>
      </div>

      {/* Input Mode Toggle */}
      <div className="input-mode-toggle">
        <button 
          className={inputMode === 'file' ? 'active' : ''}
          onClick={() => setInputMode('file')}
        >
          📁 Upload File
        </button>
        <button 
          className={inputMode === 'text' ? 'active' : ''}
          onClick={() => {
            console.log('Switching to text mode');
            setInputMode('text');
          }}
        >
          📝 Paste Text
        </button>
      </div>

      {/* File Upload Section */}
      {inputMode === 'file' && (
        <div className="upload-section">
        <div 
          className={`dropzone ${isDragOver ? 'active' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <div className="dropzone-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="dropzone-text">
            <h3 className="dropzone-title">
              {isDragOver ? 'Drop files here' : 'Drag and drop files here'}
            </h3>
            <p className="dropzone-subtitle">
              or <span style={{ color: '#3b82f6', fontWeight: '600' }}>click to browse</span>
            </p>
            <p className="file-types">Supports: JPEG, PNG, JPG, PDF, DOC, DOCX, TXT</p>
          </div>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.bmp,.pdf,.doc,.docx,.txt"
            onChange={handleFileInput}
            style={{ display: 'none' }}
            id="file-input"
          />
        </div>
          
          {extractedText && (
            <div className="extracted-text">
              <h3>Extracted Text:</h3>
              <pre>{extractedText}</pre>
              <button onClick={parseTextInput} className="manual-parse-btn">
                🔄 Manual Parse
              </button>
            </div>
          )}
        </div>
      )}

      {/* Text Input Section */}
      {inputMode === 'text' && (
        <div className="text-input-section">
          <textarea
            value={textInput}
            onChange={(e) => {
              console.log('Text input changed:', e.target.value.substring(0, 50) + '...');
              setTextInput(e.target.value);
            }}
            placeholder="Paste your text here..."
            className="text-input"
            rows={10}
          />
          <button onClick={parseTextInput} className="manual-parse-btn">
            🔄 Manual Parse
          </button>
        </div>
      )}

      {/* Title Section */}
      <div className="title-section">
        <label className="title-label">Title:</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="title-input"
          placeholder="Enter title (optional)"
        />
      </div>

      {/* Lyrics Table */}
      <div className="lyrics-table-container">
        <table className="lyrics-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Hindi</th>
              <th>Transliteration</th>
              <th>Translation</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {lyrics.map((lyric, index) => (
              <tr key={index} className="lyric-row">
                <td className="line-number">{index + 1}</td>
                <td>
                  <div className="hindi-input-container">
                    <textarea
                      value={lyric.hindi}
                      onInput={(e) => handleHindiInput(e, index)}
                      onKeyDown={(e) => handleHindiKeyDown(e, index)}
                      className="lyric-input hindi-input"
                      placeholder="Type Roman → Get Hindi script suggestions (↑↓ to navigate, Space/Enter to accept)"
                      rows={1}
                    />
                    
                    {/* Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (() => {
                      const textarea = document.querySelector('.hindi-input:focus') as HTMLTextAreaElement;
                      const position = textarea ? textarea.getBoundingClientRect() : { bottom: 100, left: 100 };
                      return (
                        <div style={{
                          position: 'fixed',
                          top: position.bottom + 5,
                          left: position.left,
                          background: 'white',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          zIndex: 9999,
                          maxHeight: '200px',
                          overflowY: 'auto',
                          minWidth: '200px',
                          maxWidth: '400px'
                        }}>
                        {/* Close button */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          borderBottom: '1px solid #eee',
                          backgroundColor: '#f8f9fa'
                        }}>
                          <span style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>
                            Hindi Suggestions
                          </span>
                          <button
                            onClick={() => {
                              setShowSuggestions(false);
                              setSuggestions([]);
                              setSelectedSuggestionIndex(0);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontSize: '14px',
                              color: '#666',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            title="Close suggestions (Esc)"
                          >
                            ✕
                          </button>
                        </div>
                        {suggestions.map((suggestion, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '10px 12px',
                              cursor: 'pointer',
                              backgroundColor: idx === selectedSuggestionIndex ? '#e3f2fd' : 'white',
                              borderBottom: '1px solid #eee',
                              borderLeft: idx === selectedSuggestionIndex ? '3px solid #2196f3' : '3px solid transparent',
                              transition: 'all 0.2s ease'
                            }}
                            onClick={() => {
                              const textarea = document.querySelector(`.hindi-input:nth-of-type(${index + 1})`) as HTMLTextAreaElement;
                              if (textarea) {
                                acceptSuggestion(suggestion, textarea, index);
                              }
                            }}
                            onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ 
                                color: '#333', 
                                fontWeight: idx === selectedSuggestionIndex ? '600' : '500',
                                fontSize: '14px'
                              }}>
                                {suggestion}
                              </span>
                              <span style={{ 
                                color: '#666', 
                                fontSize: '12px',
                                backgroundColor: '#f5f5f5',
                                padding: '2px 6px',
                                borderRadius: '3px'
                              }}>
                                {currentWord}
                              </span>
                            </div>
                          </div>
                        ))}
                        <div style={{
                          padding: '6px 12px',
                          fontSize: '11px',
                          color: '#666',
                          borderTop: '1px solid #eee',
                          backgroundColor: '#f8f9fa'
                        }}>
                          ↑↓ Navigate • Space Normal Space • Enter Accept Suggestion • Esc Close • Tab Quick Accept (Roman→Hindi Script)
                        </div>
                      </div>
                      );
                    })()}
                  </div>
                </td>
                <td className="transliteration-column">
                  <textarea
                    value={lyric.transliteration}
                    onInput={(e) => handleTransliterationInput(e, index)}
                    className="lyric-input transliteration-input"
                    placeholder="Type transliteration text (Diplomat font)"
                    style={{ fontFamily: 'Diplomat, monospace' }}
                    rows={1}
                  />
                </td>
                <td>
                  <textarea
                    value={lyric.translation}
                    onInput={(e) => handleTextareaInput(e, index, 'translation')}
                    className="lyric-input"
                    placeholder="English translation..."
                    rows={1}
                  />
                </td>
                <td>
                  <button 
                    onClick={() => removeLyric(index)}
                    className="remove-btn"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button onClick={addLyric} className="btn btn-secondary">
          ➕ Add Line
        </button>
        <button onClick={generateCSV} className="btn btn-primary">
          📥 Download CSV
        </button>
        <button onClick={clearAll} className="btn btn-secondary">
          🗑️ Clear All
        </button>
      </div>

      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-spinner"></div>
          <p>Processing file...</p>
        </div>
      )}
      
      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>Yugal Kunj</h3>
            <p>Spreading Divine Love Through Technology</p>
          </div>
          <div className="footer-links">
            <p>YK-CSV - Lyrics Converter for VMix</p>
            <p>Converting Kripalu Ji Maharaj's divine Compositions into digital format</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Yugal Kunj. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;