const express = require("express");
const cors = require("cors");
const http = require("http");
const debug = require('debug')('app:server');
const debugError = require('debug')('app:error');
const dbModule = require('./database');

const app = express();

const server = http.createServer(app);
const io = require('socket.io')(server,{
  cors: {origin: "http://talk-rooms-david-jenn.herokuapp.com/"}
   
});

//app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// SOCKETS
require('./socketHandlers')(io);

app.use('/api/room', require('./routes/api/room'));

app.use((req, res, next) => {
  const i = 0 
  if (i === 0) {
    console.log("hello")
  }

  debugError(`sorry could not find ${req.originalUrl}`);
  res.status(404).type('text/plain').send(`Sorry could not find ${req.originalUrl}`);
});

app.use((err, req, res, next) => {
  
  debugError(err);
  res.status(500).json( {error: err.message} );
});

const hostname = 'localhost'
const port = 5000;
server.listen(port, () => {
  
  debug(`Server listening on port: ${port}`);
  console.log(`Server listening on port: ${port}`);
  console.log("hello world")
});
