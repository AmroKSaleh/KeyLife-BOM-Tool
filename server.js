/**
 * @file server.js
 * @description Enhanced Express server for serving the production build
 * with better error handling and logging
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist'), {
    maxAge: '1y',
    etag: true,
    lastModified: true,
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '0.1.0-beta'
    });
});

// SPA fallback - serve index.html for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'), (err) => {
        if (err) {
            console.error('Error sending file:', err);
            res.status(500).send('Internal Server Error');
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, HOST, () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║   KeyLife Electronics - BOM Consolidation Tool         ║
║   Version: 0.1.0 Beta                                  ║
╚════════════════════════════════════════════════════════╝

🚀 Server running at: http://${HOST}:${PORT}
📁 Serving from: ${path.join(__dirname, 'dist')}
🕐 Started at: ${new Date().toLocaleString()}

Press Ctrl+C to stop the server
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n⏳ SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n⏳ SIGINT received, shutting down gracefully...');
    process.exit(0);
});