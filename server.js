require('dotenv').config()


const express = require("express");
const cors = require("cors");
const path = require('path');
const http = require("http");
const debug = require('debug')('app:server');
const debugError = require('debug')('app:error');
//const dbModule = require('./database');

const app = express();

const server = http.createServer(app);
const io = require('socket.io')(server,{
  cors: {
    origin: ['https://talk-rooms-david-jenn.herokuapp.com'], //https://talk-rooms-david-jenn.herokuapp.com http://localhost:3000
    credentials: true,
   },
});

//app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));



app.use('/api/room', require('./routes/api/room'));
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

//SOCKETS
require('./socketHandlers')(io);


app.use((err, req, res, next) => {
  debugError(err);
  res.status(500).json( {error: err.message} );
});


const port = process.env.PORT;
server.listen(port, () => {
  
  debug(`Server listening on port: ${port}`);
  console.log(`Server listening on port: ${port}`);
});