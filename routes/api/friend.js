const express = require('express');
const dbModule = require('../../database');

const asyncCatch = require('../../middleware/async-catch');

const router = express.Router();


router.get('/friend-list/:userId', asyncCatch(async (req, res, next) => {
  const userId = req.params.userId;
  console.log('id = ' + userId);
  const friends = await dbModule.findUsersFriends(userId);
  if(!friends) {
    res.status(404).json({error: 'friends not found'})
  } else {
    res.status(200).json(friends);
  }
}))

router.get(
  '/requests/:userId',
  asyncCatch(async (req, res, next) => {
    const userId = req.params.userId;

    const requests = await dbModule.findUserFriendRequests(userId);
    res.status(200).json(requests);
  })
);

router.put(
  '/send-request',
  asyncCatch(async (req, res, next) => {
    
    const friendRequest = req.body;
    await dbModule.insertFriendRequest(friendRequest);
    res.status(200).json({ msg: 'Friend Request sent!'})
  })
);

router.put('/accept-request', asyncCatch(async (req, res, next) => {
  const connectionData = req.body;
  console.log(connectionData)

  const connectionOne = {
    userId: connectionData.connectionOne.id,
    friend: connectionData.connectionTwo
  }
  const connectionTwo = {
    userId: connectionData.connectionTwo.id,
    friend: connectionData.connectionOne
  }
  await dbModule.insertNewFriendConnection(connectionOne);
  await dbModule.insertNewFriendConnection(connectionTwo);

  res.status(200).json({message: 'Friend added!'})
}))

//TODO Add update feature to add a removed flag! to cancel requests.

module.exports = router;
