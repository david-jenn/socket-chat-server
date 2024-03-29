require('dotenv').config();
const { MongoClient, ObjectId, ConnectionCreatedEvent } = require('mongodb');

let _db = null;

async function connect() {
  if (!_db) {
    const dbUrl = process.env.DB_URL;
    const dbName = process.env.DB_NAME;
    const client = await MongoClient.connect(dbUrl);
    _db = client.db(dbName);
    console.log('connected');
  }
  return _db;
}

async function ping() {
  const db = await connect();
  await db.command({
    ping: 1,
  });
  console.log('ping');
}

const newId = (str) => ObjectId(str);

async function insertDirectChatRoom(roomId) {
  const db = await connect();

  await db.collection('directChatRoom').insertOne({
    _id: roomId,
    timestamp: new Date(),
  });
}

async function findDirectChatById(id) {
  const db = await connect();
  const room = await db.collection('directChatRoom').findOne({
    _id: {
      $eq: id,
    },
  });
  return room;
}

//Deprecated
// async function insertNewRoom(room) {
//   const db = await connect();
//   await db.collection('rooms').insertOne({
//     ...room,
//     timestamp: new Date(),
//   });
// }
//Deprecated
async function insertOneComment(comment) {
  const db = await connect();
  await db.collection('comments').insertOne({
    ...comment,
    timestamp: new Date(),
  });
}
//Deprecated
async function findRoomsComments(room) {
  const db = await connect();
  const comments = await db
    .collection('comments')
    .find({
      room: {
        $eq: room,
      },
    })
    .toArray();
  return comments;
}

async function findRooms() {
  const db = await connect();
  const rooms = await db.collection('rooms').find({}).toArray();
  return rooms;
}
async function findOneRoom(roomId) {
  roomIdMongo = new ObjectId(roomId);
  const db = await connect();
  const room = await db.collection('rooms').findOne({
    _id: {
      $eq: roomIdMongo,
    },
  });
  return room;
}

async function findRoomByName(name) {
  const db = await connect();
  const room = await db.collection('rooms').findOne({
    name: {
      $eq: name,
    },
  });
  return room;
}

async function findUserById(id) {
  const db = await connect();
  const user = await db.collection('user').findOne({
    _id: {
      $eq: id,
    },
  });
  return user;
}

async function findUserByEmail(email) {
  const db = await connect();
  const user = await db.collection('user').findOne({
    email: {
      $eq: email,
    },
  });
  return user;
}

async function findUserByDisplayName(displayName) {
  const db = await connect();
  const user = await db.collection('user').findOne({
    displayName: {
      $eq: displayName,
    },
  });
  return user;
}

async function insertOneUser(user) {
  const db = await connect();

  await db.collection('user').insertOne(user);
}

async function insertFriendRequest(friendRequest) {
  const db = await connect();
  await db.collection('friendRequest').insertOne({ ...friendRequest, timestamp: new Date() });
}

async function findUserFriendRequests(userId) {
  const db = await connect();
  const requests = await db
    .collection('friendRequest')
    .find({
      'friend.id': {
        $eq: userId,
      },
      accepted: {
        $eq: false,
      },
      canceled: {
        $ne: true,
      },
    })
    .toArray();
  return requests;
}

async function findSentFriendRequests(userId) {
  const db = await connect();
  const requests = await db
    .collection('friendRequest')
    .find({
      'sender.id': {
        $eq: userId,
      },
      accepted: {
        $eq: false,
      },
      canceled: {
        $ne: true,
      },
    })
    .toArray();
  return requests;
}

async function findOneFriend(userId, friendId) {
  const db = await connect();

  const friend = await db.collection('friendConnection').findOne({
    userId: {
      $eq: userId,
    },
    'friend.id': {
      $eq: friendId,
    },
  });

  return friend;
}

async function insertNewFriendConnection(friendConnection) {
  const db = await connect();
  friendConnection.removed = false;
  await db.collection('friendConnection').insertOne(friendConnection);
}

async function acceptFriendRequests(userId, friendId) {
  const db = await connect();
  db.collection('friendRequest').updateMany(
    {
      'sender.id': {
        $eq: friendId,
      },
      'friend.id': {
        $eq: userId,
      },
    },
    {
      $set: {
        accepted: true,
      },
    }
  );
}
async function cancelFriendRequests(userId, friendId) {
  const db = await connect();
  db.collection('friendRequest').updateMany(
    {
      'sender.id': {
        $eq: friendId,
      },
      'friend.id': {
        $eq: userId,
      },
    },
    {
      $set: {
        canceled: true,
      },
    },
    {
      $set: {
        accepted: false,
      },
    }
  );
}

async function findUsersFriends(userId) {
  const db = await connect();
  const friends = await db
    .collection('friendConnection')
    .find({
      userId: {
        $eq: userId,
      },

      removed: {
        $ne: true,
      },
    })
    .toArray();

  return friends;
}

async function removeFriendConnection(userId, friendId) {
  const db = await connect();
  await db.collection('friendConnection').updateMany(
    {
      userId: {
        $eq: userId,
      },
      'friend.id': {
        $eq: friendId,
      },
    },
    {
      $set: {
        removed: true,
      },
    }
  );
}

async function updateUnreadConnectionMessages(connectionId, unReadCount) {
  console.log('updating...');
  console.log(connectionId);
  const mongoId = newId(connectionId);
  const db = await connect();
  if (unReadCount === 'OFFLINE') {
    console.log('updating offline user...');
    await db.collection('friendConnection').updateOne(
      {
        _id: {
          $eq: mongoId,
        },
      },
      {
        $inc: {
          unReadCount: 1,
        },
      }
    );
  } else {
    console.log('updating Online users');
    await db.collection('friendConnection').updateOne(
      
      {
        _id: {
          $eq: mongoId,
        },
      },
      {
        $set: {
          unReadCount: unReadCount,
        },
      }
    );
  }
}

async function insertOneGroup(group) {
  const db = await connect();
  await db.collection('group').insertOne(group);
}

async function insertOneGroupConnection(connection) {
  const db = await connect();
  await db.collection('groupConnection').insertOne(connection);
}

module.exports = {
  connect,
  insertOneComment,
  findRoomsComments,
  newId,
  findUserByEmail,
  findUserById,
  insertOneUser,
  findUserByDisplayName,
  findRooms,
  findOneRoom,
  insertDirectChatRoom,
  findDirectChatById,
  findRoomByName,
  insertFriendRequest,
  insertNewFriendConnection,
  findUserFriendRequests,
  findSentFriendRequests,
  acceptFriendRequests,
  cancelFriendRequests,
  findUsersFriends,
  findOneFriend,
  updateUnreadConnectionMessages,
  removeFriendConnection,
  insertOneGroup,
  insertOneGroupConnection
};

ping();
