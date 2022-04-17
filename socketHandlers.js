

module.exports = function (io) {
  const db = require('./database');

  const botName = 'TalkRooms';

  
  const users = [];
  let currentRoom;
  let logoutInterval;

  io.on('connection', (socket) => {
    let typingUsers = [];
    socket.on('joinRoom', ({ username, room }) => {
      currentSocket = room;
      socket.join(room);
      const user = userJoin(socket.id, username, room);

      socket.join(room);

      //Shows just to the client
      socket.emit('message', formatMessage(botName, `Welcome to Talk Rooms! room ${room}!`));

      //Shows to everyone else but the client
      socket.broadcast.to(room).emit('message', formatMessage(botName, `${username} has joined room ${room}!`));

      //Shows to everyone
      // io.emit('info', 'Hello World')

      //Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    });

    //Listen for chatMessage

    socket.on('chatMessage', (username, msg, room) => {
      // const user = getCurrentUser(socket.id);
      console.log(msg);
      const comment = {
        username, msg, room
      }

      db.insertOneComment(comment);
      console.log(room);
     
      io.to(room).emit('message', formatMessage(username, msg));
    });

    //check for a user typing
    socket.on('typing', (username, typing, room) => {
     
      if (typing) {
        if (!typingUsers.includes(username)) {
          typingUsers.push(username);
        }
      } else {
        let copy = typingUsers.filter((x) => x != username);
        typingUsers = [...copy];
      }
      let typingOutput = "";
      for(user of typingUsers) {
        typingOutput += `${user} is typing... `
      }
      console.log(typingOutput);

      io.to(room).emit('typingOutput', typingOutput);
 
  
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
          users: getRoomUsers(user.room),
        });
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
