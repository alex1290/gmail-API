import gmail from './gmail.js'
import { resolve } from 'url';

const express = require('express');
const http = require('http')
const cors = require('cors');
const port = 3005;


let app = express();

// app.use(cors);
app.get('/', (req, res) => {
    gmail()
    res.send('run')
})

app.listen(port, () => {
    console.log(`start listen on port : ${port}`);
})
