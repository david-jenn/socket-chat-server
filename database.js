require('dotenv').config()
const { MongoClient, ObjectId } = require('mongodb');

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

const newId = (str) => ObjectId(str);

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

module.exports = {
  connect,
  insertOneComment,
  findRoomsComments,
  newId,
  findUserByEmail,
  insertOneUser,
  findUserByDisplayName
}

ping();