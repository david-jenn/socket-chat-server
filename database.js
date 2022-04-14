const { MongoClient, ObjectId } = require('mongodb');

let _db = null;

async function connect() {
  if(!_db) {
    const dbUrl = 'mongodb://localhost:27017';
    const dbName = 'real_time';
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

module.exports = {
  connect,
  insertOneComment,
  findRoomsComments,
}

ping();