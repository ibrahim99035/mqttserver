const express = require('express');
const path = require('path');
const app = express();
const PORT = 5500;

// Serve static files (your HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main HTML file for any route (single page app style)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`HTML server running at http://localhost:${PORT}`);
  console.log(`Open this URL in your browser to see the ESP8266 interface`);
});