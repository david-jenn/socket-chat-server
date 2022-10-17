module.exports = function (io) {
  const db = require('./database');

  const botName = 'TalkRooms';

  let users = [];
  let currentRoom;
  let logoutInterval;

  io.on('connection', (socket) => {
    //checkInactivity(socket);

    let typingUsers = [];
    console.log('new connection');
    console.log(socket.id);

    socket.on('USER_JOIN', (newUser) => {
      const updateUsers = users.filter((user) => {
        return user.socketId === user._id;
      });
      users = [...updateUsers];

      newUser.socketId = socket.id;
      let existingUser;
      for (user of users) {
        if (user._id === newUser._id) {
          existingUser = user;
          user.socketId = socket.id;
          io.to(socket.id).emit('JOINED', true);
        }
      }
      if (!existingUser && newUser._id) {
        newUser.socketId = socket.id;
        users.push(newUser);
        console.log('user array');
        console.log(users);
        io.to(socket.id).emit('JOINED', true);
      }
    });

    socket.on('FRIEND_REQUEST', ({ friendId, userDisplayName, userId }) => {
      console.log(friendId);
      console.log(userId);
      let friend;
      let sender;
      console.log('users in friend request');
      console.log(users);
      //TO DO: FRIEND COMES BACK UNDEFINED
      for (user of users) {
        if (user._id === friendId) {
          friend = user;
        }
        if (user._id === userId) {
          sender = user;
        }
      }

      if (friend) {
        console.log(friend.socketId);
        io.to(friend.socketId).emit('REQUEST_RECEIVED', `Friend request from ${userDisplayName}`);
      }

      if (sender) {
        console.log(sender.socketId);
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
        if (user._id === data.sender?._id) {
          sender = user;
        }
      }

      if (friend) {
        io.to(friend.socketId).emit('REQUEST_ACCEPTED_RECEIVER', data);
      }
      if (sender) {
        io.to(sender.socketId).emit('REQUEST_ACCEPTED_SENDER', data);
      }
    });

    socket.on('REJECT_REQUEST', (data) => {
      let friend;
      let sender;

      for (user of users) {
        if (user._id === data.receiver?.id) {
          friend = user;
        }
        if (user._id === data.sender?._id) {
          sender = user;
        }
      }

      if (friend) {
        io.to(friend.socketId).emit('REQUEST_REJECTED_RECEIVER', data);
      }
      if (sender) {
        io.to(sender.socketId).emit('REQUEST_REJECTED_SENDER', data);
      }
    });

    socket.on('CANCEL_REQUEST', (data) => {
      let friend;
      let sender;

      for (user of users) {
        if (user._id === data.receiver?.id) {
          friend = user;
        }
        if (user._id === data.sender?._id) {
          sender = user;
        }
      }

      if (friend) {
        io.to(friend.socketId).emit('REQUEST_CANCELED_RECEIVER', data);
      }
      if (sender) {
        io.to(sender.socketId).emit('REQUEST_CANCELED_SENDER', data);
      }
    });

    socket.on('joinRoom', ({ username, room }) => {
      currentSocket = room;
      socket.join(room);
      const user = userJoin(socket.id, username, room);

      socket.join(room);

      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    });

    //Listen for chatMessage

    socket.on('chatMessage', (username, msg, room) => {
      checkInactivity(socket);
      // const user = getCurrentUser(socket.id);

      const comment = {
        username,
        msg,
        room,
      };

      db.insertOneComment(comment);

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
      let typingOutput = '';
      for (user of typingUsers) {
        typingOutput += `${user} is typing... `;
      }
      console.log(typingOutput);

      io.to(room).emit('typingOutput', typingOutput);
    });

    // Run When Client disconnects
    socket.on('disconnect', () => {
      const updatedUsers = users.filter((user) => {
        return user.socketId !== socket.id;
      });
      console.log(updatedUsers);
      users = [...updatedUsers];
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
      //users.push(user);
    }

    return user;
  }

  function getRoomUsers(room) {
    return users.filter((user) => user.room === room);
  }
};
