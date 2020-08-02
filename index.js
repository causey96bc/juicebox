require('dotenv').config()
const { PORT = 3000 } = process.env
const express = require('express');
const server = express();
const bodyParser = require('body-parser')
const apiRouter = require('./api');
const morgan = require('morgan');
const { client } = require('./db');
server.use((req, res, next) => {
    console.log("<____Body Logger START____>");
    console.log(req.body, 'this is the body');
    console.log("<_____Body Logger END_____>");

    next();
});
server.use('/api', (req, res, next) => {
    console.log("A request was made to /api");
    next();
});
server.use(bodyParser.json());
server.use(morgan('dev'))




server.use('/api', apiRouter)

client.connect();

server.listen(PORT, () => {
    console.log('The server is up on port', PORT)
});

