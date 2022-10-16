module.exports = function (io) {
  const db = require('./database');

  const botName = 'TalkRooms';

  const users = [];
  let currentRoom;
  let logoutInterval;

  io.on('connection', (socket) => {
    //checkInactivity(socket);
    let typingUsers = [];

    socket.on('USER_JOIN', (newUser) => {
      newUser.socketId = socket.id;
      let existingUser;
      for (user of users) {
        if (user._id === newUser._id) {
          existingUser = user;
        }
      }
      if (!existingUser) {
        users.push(newUser);
        console.log(users);
      }
    });

    socket.on('FRIEND_REQUEST', ({ friendId, userDisplayName, userId }) => {
      let friend;
      let sender;
      for (user of users) {
        if (user._id === friendId) {
          friend = user;
          user.socketId = socket._id;
        }
        if(user._id === userId) {
          sender = user
        }
      }
      console.log(sender);
      console.log(friend);
      if (friend) {
        console.log('sending to: ' + friend.socketId);
        io.to(friend.socketId).emit('REQUEST_RECEIVED', `Friend request from ${userDisplayName}`);
      }

      if(sender) {
        console.log('sending to: ' + sender.socketId);
        io.to(sender.socketId).emit('REQUEST_SENT', `Friend request sent to ${sender.displayName}`);
      }
    });


    socket.on('ACCEPT_REQUEST', (data) => {
      let friend;
      let sender;

      for (user of users) {
        if (user._id === data.receiver?.id) {
          friend = user;
        }
        if(user._id === data.sender?._id) {
          sender = user
        }
      }
      console.log('sender: ' + sender);
      if(friend) {
        console.log('sending REQUEST_ACCEPTED_RECEIVER to: ' + friend.socketId);
        io.to(friend.socketId).emit('REQUEST_ACCEPTED_RECEIVER', data);
      }
      if(sender) {
        console.log('sending REQUEST_ACCEPT_SENDER to: ' + sender.socketId);
        io.to(sender.socketId).emit('REQUEST_ACCEPTED_SENDER', data);
      }
    })

    socket.on('REJECT_REQUEST', (data) => {
      let friend;
      let sender;

      for (user of users) {
        if (user._id === data.receiver?.id) {
          friend = user;
        }
        if(user._id === data.sender?._id) {
          sender = user
        }
      }

      if(friend) {
        console.log('sending REQUEST_REJECTED_RECEIVER to: ' + friend.socketId);
        io.to(friend.socketId).emit('REQUEST_REJECTED_RECEIVER', data);
      }
      if(sender) {
        console.log('sending REQUEST_ACCEPT_SENDER to: ' + sender.socketId);
        io.to(sender.socketId).emit('REQUEST_REJECTED_SENDER', data);
      }
    })

    socket.on('CANCEL_REQUEST', (data) => { 
      let friend;
      let sender;
      console.log(data);
      for (user of users) {
        if (user._id === data.receiver?.id) {
          friend = user;
        }
        if(user._id === data.sender?._id) {
          sender = user
        }
      }
      console.log('sender: ' + sender);
      if(friend) {
        console.log('sending CANCEL_REQUEST_RECEIVER to: ' + friend.socketId);
        
        io.to(friend.socketId).emit('REQUEST_CANCELED_RECEIVER', data);
      }
      if(sender) {
        console.log('sending CANCEL_REQUEST_SENDER to: ' + sender.socketId);
        
        io.to(sender.socketId).emit('REQUEST_CANCELED_SENDER', data);
      }
    })

    socket.on('joinRoom', ({ username, room }) => {
      currentSocket = room;
      socket.join(room);
      const user = userJoin(socket.id, username, room);

      socket.join(room);

      //Shows to everyone else but the client
      // socket.broadcast.to(room).emit('message', formatMessage(botName, `${username} has joined room ${room}!`));

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

      checkInactivity(socket);
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

      checkInactivity(socket);

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
      console.log('disconnected...');
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
      timestamp: new Date(),
    };

    return obj;
  }

  function userJoin(id, username, room) {
    const user = { id, username, room };
    const duplicateUsers = users.filter((x) => x.username === user.username && x.room === user.room);
    if (duplicateUsers.length === 0) {
      users.push(user);
    }

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

  function checkInactivity(socket) {
    clearTimeout(socket.inactivityTimeout);
    socket.inactivityTimeout = setTimeout(() => {
      socket.disconnect(true);
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
    }, 300000);
  }
};
