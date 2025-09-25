const express = require('express');
const next = require('next');
const path = require('path');

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';

// For standalone build, serve static files with config injection
if (!dev) {
  const app = express();

  // API Base URL from environment
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';

  // Inject config into all HTML files
  app.use((req, res, next) => {
    const originalSend = res.send;
    res.send = function(data) {
      if (typeof data === 'string' && data.includes('<html')) {
        // Inject runtime config into the HTML head
        const configScript = `
        <script>
          window.__NEXT_RUNTIME_CONFIG__ = {
            NEXT_PUBLIC_API_BASE_URL: "${apiBaseUrl}"
          };
        </script>
        `;
        data = data.replace('<head>', '<head>' + configScript);
      }
      return originalSend.call(this, data);
    };
    next();
  });

  // Serve static files from .next directory
  app.use(express.static('.next/standalone'));

  // Catch all handler
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '.next/standalone/public/index.html'));
  });

  console.log(`Server starting on port ${port} with API: ${apiBaseUrl}`);
  app.listen(port, () => {
    console.log(`Ready on http://localhost:${port}`);
  });
} else {
  // Development mode - use Next.js dev server
  const nextApp = next({ dev });
  const handle = nextApp.getRequestHandler();

  nextApp.prepare().then(() => {
    const app = express();
    app.get('*', (req, res) => handle(req, res));
    app.listen(port, () => {
      console.log(`Ready on http://localhost:${port}`);
    });
  });
}
