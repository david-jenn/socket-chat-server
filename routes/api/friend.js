const express = require('express');
const { Timestamp } = require('mongodb');
const dbModule = require('../../database');

const asyncCatch = require('../../middleware/async-catch');

const router = express.Router();

router.get(
  '/friend-list/:userId',
  asyncCatch(async (req, res, next) => {
    const userId = req.params.userId;
    console.log('id = ' + userId);
    const friends = await dbModule.findUsersFriends(userId);
    if (!friends) {
      res.status(404).json({ error: 'friends not found' });
    } else {
      res.status(200).json(friends);
    }
  })
);

router.get(
  '/find/:userId/:friendId',
  asyncCatch(async (req, res, next) => {
    const userId = req.params.userId;
    const friendId = req.params.friendId;

    const friend = await dbModule.findOneFriend(userId, friendId);
    console.log(friend);
    if (!friend) {
      res.status(404).json({ error: 'Friend not found' });
    } else {
      res.status(200).json(friend);
    }
  })
);

router.get(
  '/requests/:userId',
  asyncCatch(async (req, res, next) => {
    const userId = req.params.userId;

    const requests = await dbModule.findUserFriendRequests(userId);
    requests.sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    const mostRecentUniqueRequests = [];
    const uniqueRequests = [];
    for (request of requests) {
      if (!mostRecentUniqueRequests.includes(request.sender.id)) {
        mostRecentUniqueRequests.push(request.sender.id);
        uniqueRequests.push(request);
      }
    }

    console.log(uniqueRequests.length);
    res.status(200).json(uniqueRequests);
  })
);

router.put(
  '/send-request',
  asyncCatch(async (req, res, next) => {
    const friendRequest = req.body;
    const userId = req.body.sender?.id;
    const friendId = req.body.friend?.id;

    const existingFriend = await dbModule.findOneFriend(userId, friendId);
    console.log(existingFriend);
    if (existingFriend) {
      res.status(400).json({ error: `Already friends with this person` });
    } else {
      await dbModule.insertFriendRequest(friendRequest);
      res.status(200).json({ msg: 'Friend Request sent!' });
    }
  })
);

router.put(
  '/accept-request',
  asyncCatch(async (req, res, next) => {
    const connectionData = req.body;

    const connectionOne = {
      userId: connectionData.connectionOne.id,
      friend: connectionData.connectionTwo,
    };
    const connectionTwo = {
      userId: connectionData.connectionTwo.id,
      friend: connectionData.connectionOne,
    };

    const existingFriend = await dbModule.findOneFriend(
      connectionData.connectionOne.id,
      connectionData.connectionTwo.id
    );
    if (existingFriend) {
      res.status(400).json({ error: 'Friend already exists' });
    } else {
      await dbModule.insertNewFriendConnection(connectionOne);
      await dbModule.insertNewFriendConnection(connectionTwo);
      await dbModule.updateFriendRequests(connectionData.connectionOne.id, connectionData.connectionTwo.id);

      res.status(200).json({ message: 'Friend added!' });
    }
  })
);

//TODO Add update feature to add a removed flag! to cancel requests.

module.exports = router;
