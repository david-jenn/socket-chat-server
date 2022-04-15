module.exports = function(io) {

  //const db = require('./database');

  const botName = 'TalkRooms';

  const users = [];

  io.on('connection', (socket) => {
    socket.on('joinRoom', ({ username, room }) => {
      const user = userJoin(socket.id, username, room);
      console.log(user);
      socket.join(user.room);
      
      //Shows just to the client
      socket.emit('message', formatMessage(botName, `Welcome to Talk Rooms! room ${room}!`));
  
      //Shows to everyone else but the client
      socket.broadcast
        .to(user.room)
        .emit('message', formatMessage(botName, `${user.username} has joined room ${user.room}!`));
  
      //Shows to everyone
      // io.emit('info', 'Hello World')
  
  
      //Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      })
    });
  
    //Listen for chatMessage
  
    socket.on('chatMessage', (msg) => {
      const user = getCurrentUser(socket.id);
      const comment = {
        username: user,
        message: msg,
        room: user.room,
      }
     // db.insertOneComment(comment);
      io.to(user.room).emit('message', formatMessage(user.username, msg));
    });
    // Run When Client disconnects
    socket.on('disconnect', () => {
      const user = userLeave(socket.id);
      if (user) {
        io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left...`));
        console.log('a user has left...');
  
        //Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      })
      }
    });
  });

  function formatMessage(username, msg) {
    const obj = {
      username,
      msg,
      date: new Date(),
    };
  
    return obj;
  }
  
  function userJoin(id, username, room) {
    const user = { id, username, room };
  
    users.push(user);
    return user;
  }
  
  function getCurrentUser(id) {
    return users.find((user) => user.id === id);
  }
  
  function userLeave(id) {
    const index = users.findIndex((user) => user.id === id);
    if (index !== -1) {
      return users.splice(index, 1)[0];
    }
  }
  
  function getRoomUsers(room) {
    return users.filter((user) => user.room === room);
  }
  
};

