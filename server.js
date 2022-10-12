require('dotenv').config()


const express = require("express");
const cors = require("cors");
const path = require('path');
const http = require("http");
const debug = require('debug')('app:server');
const debugError = require('debug')('app:error');
const dbModule = require('./database');

const app = express();




app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/comment', require('./routes/api/comment'));
app.use('/api/user', require('./routes/api/user'));
app.use('/api/room', require('./routes/api/room'));
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
});




app.use((err, req, res, next) => {
  debugError(err);
  res.status(500).json( {error: err.message} );
});


const port = process.env.PORT;
const server = app.listen(port, () => {
  
  debug(`Server listening on port: ${port}`);
  console.log(`Server listening on port: ${port}`);
});

const io = require('socket.io')(server,{
  pingTimeout: 6000,
  cors: {
    origin: 'https://talk-rooms-david-jenn.herokuapp.com', //https://talk-rooms-david-jenn.herokuapp.com http://localhost:3000
    credentials: true,
   },
});


//SOCKETS
require('./socketHandlers')(io);