/**
 * Render PDF file to one image per page (data URLs) for vision API.
 * Uses pdfjs-dist v4; worker configured for Vite (bundled) or CDN fallback.
 */

let workerInitialized = false;
let pdfjsModule = null;

async function getPdfJs() {
  if (pdfjsModule) return pdfjsModule;
  try {
    pdfjsModule = await import('pdfjs-dist/build/pdf.mjs');
  } catch (e1) {
    try {
      pdfjsModule = await import('pdfjs-dist/legacy/build/pdf.mjs');
    } catch (e2) {
      throw new Error('pdfjs-dist could not be loaded. Run: npm install pdfjs-dist');
    }
  }
  pdfjsModule = pdfjsModule?.default || pdfjsModule;
  return pdfjsModule;
}

async function initWorker() {
  if (workerInitialized) return;
  const pdfjs = await getPdfJs();
  if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';
  }
  workerInitialized = true;
}

/**
 * Convert a PDF File to an array of image data URLs (one per page).
 * @param {File} pdfFile - PDF file
 * @param {{ scale?: number, maxPages?: number }} options - scale for rendering (default 2), max pages to process (default 50)
 * @returns {Promise<{ pageIndex: number, dataUrl: string }[]>}
 */
export async function pdfToPageDataUrls(pdfFile, options = {}) {
  const { scale = 2, maxPages = 50 } = options;
  await initWorker();
  const pdfjs = await getPdfJs();
  const getDocument = pdfjs.getDocument || pdfjs.default?.getDocument;
  if (!getDocument) throw new Error('pdfjs-dist: getDocument not found');
  const arrayBuffer = await pdfFile.arrayBuffer();
  const loadingTask = getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await (loadingTask.promise || loadingTask);
  const numPages = Math.min(pdf.numPages, maxPages);
  const out = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    const renderTask = page.render({
      canvasContext: ctx,
      viewport,
    });
    await (renderTask.promise || renderTask);
    const dataUrl = canvas.toDataURL('image/png');
    out.push({ pageIndex: i, dataUrl });
  }

  return out;
}
