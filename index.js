const PORT = 3000;
const express = require('express');
const server = express();
const bodyParser = require('body-parser')
const apiRouter = require('./api');
const morgan = require('morgan');
const { client } = require('./db');
client.connect();


server.listen(PORT, () => {
    console.log('The server is up on port', PORT)
});

server.use((req, res, next) => {
    console.log("<____Body Logger START____>");
    console.log(req.body);
    console.log("<_____Body Logger END_____>");

    next();
});
server.use('/api', (req, res, next) => {
    console.log("A request was made to /api");
    next();
});
server.use(bodyParser.json());
server.use(morgan('dev'))

server.get('/api', (req, res, next) => {
    console.log("A get request was made to /api");
    res.send({ message: "success" });
});

server.use('/api', apiRouter)


// server.get('/api', (req, res, next) => {
//     console.log("A get request was made to /api");
//     res.send({ message: "the other success" });
// });

// server.use('/api', (req, res, next) => {
//     console.log("A request was made to /api");
//     next();
// });