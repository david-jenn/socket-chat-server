require('dotenv').config()
const { MongoClient, ObjectId, ConnectionCreatedEvent } = require('mongodb');

let _db = null;

async function connect() {
  if(!_db) {
    console.log(process.env.DB_NAME);
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
    ping: 1
  });
  console.log('ping');
}

const newId = (str) => ObjectId(str)

async function insertNewRoom(room) {
  const db = await connect();
  await db.collection('rooms').insertOne({
    ...room,
    timestamp: new Date()
  })
}

async function insertOneComment(comment) {
  const db = await connect();
  await db.collection('comments').insertOne({
    ...comment,
    timestamp: new Date()
  })
}

async function findRoomsComments(room) {
  const db = await connect();
  const comments = await db.collection('comments').find({
    room: {
      $eq: room,
    },
  })
  .toArray();
  return comments
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
  })
  return room
}

async function findRoomByName(name) {
  const db = await connect();
  const room = await db.collection('rooms').findOne({
    name: {
      $eq: name
    },
  });
  return room;
}

async function findUserById(id) {
  const db = await connect();
  const user = await db.collection('user').findOne({
    _id: {
      $eq: id,
    }
  })
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
  await db.collection('friendRequest').insertOne({...friendRequest, timestamp: new Date()});
}

async function findUserFriendRequests(userId) {

  const db = await connect();
  const requests = await db.collection('friendRequest').find({
    'friend.id': {
      $eq: userId
    }
  }).toArray();
  return requests;
}

async function insertNewFriendConnection(friendConnection) {
  const db = await connect();
 
  await db.collection('friendConnection').insertOne(friendConnection);
}

async function findUsersFriends(userId) {
  console.log('in friends data ' + userId);
  const db = await connect();
  const friends = await db.collection('friendConnection').find({
    userId: {
      $eq: userId
    }
  }).toArray();

  return friends;
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
  insertNewRoom,
  findRoomByName,
  insertFriendRequest,
  insertNewFriendConnection,
  findUserFriendRequests,
  findUsersFriends
}

ping();