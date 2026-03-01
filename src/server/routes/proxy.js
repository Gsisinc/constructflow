import express from 'express';
import axios from 'axios';

const router = express.Router();

/**
 * Proxy endpoint to fetch content from external URLs
 * Bypasses CORS restrictions by routing through the server
 */
router.post('/fetch-url', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Fetch the URL with a timeout
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      maxRedirects: 5
    });

    // Return the HTML content
    res.json({
      success: true,
      html: response.data,
      status: response.status,
      contentType: response.headers['content-type']
    });
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch URL',
      message: error.message
    });
  }
});

/**
 * Alternative: Use Browserless.io for real browser rendering
 * This endpoint takes a screenshot of a webpage
 */
router.post('/screenshot', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // You would need to set up Browserless.io account
    // For now, return a placeholder response
    res.json({
      success: true,
      message: 'Screenshot feature requires Browserless.io setup',
      url: url
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
