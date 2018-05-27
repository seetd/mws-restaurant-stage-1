const path = require('path');
const express = require('express');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

app.listen(8000, () => {
    console.log('Restaurant Reviews listening on port 8000!');
});