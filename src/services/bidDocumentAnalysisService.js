/**
 * Bid Document Analysis Service
 * Analyzes bid documents (PDFs, images, text) using OpenAI Vision and GPT
 * Extracts key information, scope, pricing, and requirements
 */

import { callOpenAI, parseLLMResponse } from './llmService';

const BID_ANALYSIS_SYSTEM_PROMPT = `You are an expert construction bid analyzer. Your task is to analyze bid documents and extract:
1. Project Overview (name, location, type, scope)
2. Key Requirements (specifications, standards, compliance)
3. Scope of Work (detailed breakdown of what needs to be done)
4. Timeline (start date, duration, milestones, deadlines)
5. Pricing Structure (bid amount, payment terms, unit prices if applicable)
6. Qualifications Required (certifications, experience, bonding requirements)
7. Risk Factors (potential challenges, constraints, dependencies)
8. Opportunities (value-add possibilities, cost reduction areas)
9. Compliance Requirements (permits, inspections, insurance)
10. Next Steps (submission deadline, contact info, required documents)

Provide a comprehensive, structured analysis that helps construction companies understand and respond to the bid.
Format your response as a detailed JSON object with these sections.`;

const DRAWING_ANALYSIS_SYSTEM_PROMPT = `You are an expert construction drawing analyzer with knowledge of building codes and construction standards. 
Your task is to analyze construction drawings and:
1. Identify all major components and systems (structural, electrical, plumbing, HVAC, fire alarm, low voltage, etc.)
2. Extract dimensions and measurements where visible
3. Identify material specifications
4. Note special requirements or conditions
5. Estimate quantities for major items (linear feet, square feet, count of fixtures, etc.)
6. Identify potential takeoff items for estimation
7. Flag any unclear areas or missing information
8. Suggest standard assumptions for missing details

Provide a detailed analysis in JSON format with sections for each system and estimated quantities.`;

/**
 * Convert file to base64 for API transmission
 * @param {File} file - The file to convert
 * @returns {Promise<string>} Base64 encoded file
 */
export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get MIME type for file
 * @param {File} file - The file
 * @returns {string} MIME type
 */
function getMimeType(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  const mimeTypes = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'txt': 'text/plain',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  return mimeTypes[extension] || file.type;
}

/**
 * Extract text from PDF using OCR via OpenAI Vision
 * @param {File} pdfFile - The PDF file
 * @returns {Promise<string>} Extracted text
 */
export async function extractTextFromPDF(pdfFile) {
  try {
    // For PDFs, we'll need to convert to images first
    // This is a simplified approach - in production, use pdf-lib or similar
    const base64 = await fileToBase64(pdfFile);
    
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-vision',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please extract all text from this document. Preserve formatting and structure as much as possible.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64}`
                }
              }
            ]
          }
        ],
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`PDF extraction failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw error;
  }
}

/**
 * Analyze bid document (text, PDF, or image)
 * @param {File|string} document - The document file or text content
 * @param {boolean} isImage - Whether the document is an image
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeBidDocument(document, isImage = false) {
  try {
    let textContent = '';
    let imageBase64 = null;

    if (typeof document === 'string') {
      // Text content
      textContent = document;
    } else if (document instanceof File) {
      // File upload
      const mimeType = getMimeType(document);
      
      if (mimeType.startsWith('image/')) {
        // Image file - use vision API
        imageBase64 = await fileToBase64(document);
      } else if (mimeType === 'application/pdf') {
        // PDF file - extract text
        textContent = await extractTextFromPDF(document);
      } else if (mimeType === 'text/plain') {
        // Text file
        textContent = await document.text();
      } else {
        // Try to extract as text
        textContent = await document.text();
      }
    }

    // Call OpenAI with vision if we have an image, otherwise use text
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let messageContent;
    if (imageBase64) {
      messageContent = [
        {
          type: 'text',
          text: 'Please analyze this bid document image and provide a comprehensive analysis.'
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`
          }
        }
      ];
    } else {
      messageContent = [
        {
          type: 'text',
          text: `Please analyze this bid document:\n\n${textContent}`
        }
      ];
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: imageBase64 ? 'gpt-4-vision' : 'gpt-4-mini',
        messages: [
          {
            role: 'system',
            content: BID_ANALYSIS_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: messageContent
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Analysis failed: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;

    // Try to parse as JSON, otherwise return as structured text
    try {
      return JSON.parse(analysisText);
    } catch (e) {
      return {
        raw_analysis: analysisText,
        sections: parseAnalysisText(analysisText)
      };
    }
  } catch (error) {
    console.error('Bid document analysis error:', error);
    throw error;
  }
}

/**
 * Analyze construction drawing for measurements and takeoff
 * @param {File} drawingFile - The drawing image file
 * @returns {Promise<Object>} Drawing analysis with measurements and takeoff items
 */
export async function analyzeDrawing(drawingFile) {
  try {
    const imageBase64 = await fileToBase64(drawingFile);
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-vision',
        messages: [
          {
            role: 'system',
            content: DRAWING_ANALYSIS_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this construction drawing and provide detailed measurements and takeoff estimates.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Drawing analysis failed: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;

    // Try to parse as JSON
    try {
      return JSON.parse(analysisText);
    } catch (e) {
      return {
        raw_analysis: analysisText,
        measurements: extractMeasurements(analysisText),
        takeoff_items: extractTakeoffItems(analysisText)
      };
    }
  } catch (error) {
    console.error('Drawing analysis error:', error);
    throw error;
  }
}

/**
 * Extract measurements from analysis text
 * @param {string} text - Analysis text
 * @returns {Array<Object>} Extracted measurements
 */
function extractMeasurements(text) {
  const measurements = [];
  
  // Look for patterns like "X feet", "X meters", "X x Y", etc.
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(?:ft|feet|m|meters|'|")/gi,
    /(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/gi
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      measurements.push({
        value: match[0],
        unit: match[1]
      });
    }
  });

  return measurements;
}

/**
 * Extract takeoff items from analysis text
 * @param {string} text - Analysis text
 * @returns {Array<Object>} Extracted takeoff items
 */
function extractTakeoffItems(text) {
  const items = [];
  
  // Look for common construction items
  const itemPatterns = [
    /(\d+(?:\.\d+)?)\s*(?:linear feet|LF|feet|ft)\s*(?:of\s+)?([^,.\n]+)/gi,
    /(\d+(?:\.\d+)?)\s*(?:square feet|SF|sq ft|sqft)\s*(?:of\s+)?([^,.\n]+)/gi,
    /(\d+(?:\.\d+)?)\s*(?:each|ea|units?)\s*(?:of\s+)?([^,.\n]+)/gi
  ];

  itemPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      items.push({
        quantity: parseFloat(match[1]),
        unit: match[0].match(/(?:linear feet|LF|feet|ft|square feet|SF|sq ft|sqft|each|ea|units?)/i)[0],
        description: match[2]?.trim() || 'Item'
      });
    }
  });

  return items;
}

/**
 * Parse analysis text into sections
 * @param {string} text - Analysis text
 * @returns {Object} Parsed sections
 */
function parseAnalysisText(text) {
  const sections = {};
  const sectionHeaders = [
    'Project Overview',
    'Key Requirements',
    'Scope of Work',
    'Timeline',
    'Pricing Structure',
    'Qualifications Required',
    'Risk Factors',
    'Opportunities',
    'Compliance Requirements',
    'Next Steps'
  ];

  sectionHeaders.forEach(header => {
    const regex = new RegExp(`${header}[:\\s]*([^]*?)(?=(?:${sectionHeaders.join('|')})[:\\s]|$)`, 'i');
    const match = text.match(regex);
    if (match) {
      sections[header] = match[1].trim();
    }
  });

  return sections;
}

export default {
  analyzeBidDocument,
  analyzeDrawing,
  fileToBase64,
  extractTextFromPDF
};
