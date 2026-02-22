/**
 * Render PDF file to one image per page (data URLs) for vision API.
 * Uses pdfjs-dist; worker is configured on first use (CDN).
 */

let workerInitialized = false;

async function initWorker() {
  if (workerInitialized) return;
  try {
    const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
    if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';
    }
    workerInitialized = true;
  } catch (e) {
    console.warn('pdfjs-dist worker init:', e);
    throw e;
  }
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
  const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
  const getDocument = pdfjs.getDocument || pdfjs.default?.getDocument;
  if (!getDocument) throw new Error('pdfjs-dist: getDocument not found');
  const arrayBuffer = await pdfFile.arrayBuffer();
  const loadingTask = getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  const numPages = Math.min(pdf.numPages, maxPages);
  const out = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;
    const dataUrl = canvas.toDataURL('image/png');
    out.push({ pageIndex: i, dataUrl });
  }

  return out;
}
