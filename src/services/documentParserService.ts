// Ensure Promise.try is available for pdfjs-dist
if (typeof (Promise as any).try !== 'function') {
  (Promise as any).try = function (fn: any, ...args: any[]) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}

import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Load worker from the installed package
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
}

export interface ParseResult {
  text: string;
  fileName: string;
  fileSize: number;
  fileType: 'pdf' | 'docx' | 'txt' | 'pasted';
  pageCount?: number;
}

export const DocumentParserService = {
  async parseFile(file: File): Promise<ParseResult> {
    const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error(
        `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 10 MB limit. Please provide a smaller file.`
      );
    }

    const name = file.name.toLowerCase();

    if (name.endsWith('.pdf') || file.type === 'application/pdf') {
      return this.parsePdf(file);
    } else if (
      name.endsWith('.docx') ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return this.parseDocx(file);
    } else if (
      name.endsWith('.txt') ||
      name.endsWith('.md') ||
      name.endsWith('.rtf') ||
      file.type.startsWith('text/')
    ) {
      return this.parseTxt(file);
    } else {
      throw new Error(
        `Unsupported file type "${file.type || file.name}". BondLens supports PDF (.pdf), Word (.docx), and plain text (.txt).`
      );
    }
  },

  async parsePdf(file: File): Promise<ParseResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      let fullText = '';
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (pageText) {
          fullText += (fullText ? '\n\n' : '') + `[Page ${i}]\n` + pageText;
        }
      }

      const cleanText = fullText.trim();
      if (!cleanText || cleanText.length < 40) {
        throw new Error(
          'Scanned or image-only PDF detected: This PDF has no extractable text. Please use an OCR tool, upload a DOCX, or paste the text directly.'
        );
      }

      return {
        text: cleanText,
        fileName: file.name,
        fileSize: file.size,
        fileType: 'pdf',
        pageCount: numPages,
      };
    } catch (err: any) {
      if (
        err.message &&
        (err.message.includes('Scanned') ||
          err.message.includes('no extractable text') ||
          err.message.includes('image-only'))
      ) {
        throw err;
      }
      console.error('PDF parsing error:', err);
      throw new Error("This PDF couldn't be read. Try a DOCX or paste the text.");
    }
  },

  async parseDocx(file: File): Promise<ParseResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const cleanText = result.value.trim();

      if (!cleanText) {
        throw new Error('The DOCX document is empty or contains only non-text media.');
      }

      return {
        text: cleanText,
        fileName: file.name,
        fileSize: file.size,
        fileType: 'docx',
      };
    } catch (err: any) {
      throw new Error(`Failed to parse Word (.docx) document: ${err.message || 'Unreadable format'}`);
    }
  },

  async parseTxt(file: File): Promise<ParseResult> {
    try {
      const text = await file.text();
      const cleanText = text.trim();

      if (!cleanText) {
        throw new Error('The text file is empty.');
      }

      return {
        text: cleanText,
        fileName: file.name,
        fileSize: file.size,
        fileType: 'txt',
      };
    } catch (err: any) {
      throw new Error(`Failed to read text file: ${err.message || 'Unreadable format'}`);
    }
  },
};
