const path = require('path');
const express = require('express');
const compression = require('compression');

// Simple no frills Express.js server that serves files from the public folder.
const app = express();
app.use(compression());
app.use('/service_worker.js', (req, res) => res.sendFile(path.join(__dirname, 'public/js/service_worker.js')));
app.use(express.static(path.join(__dirname, 'public')));

app.listen(8000, () => {
    console.log('Restaurant Reviews listening on port 8000!');
});