const express = require('express');
const { Timestamp } = require('mongodb');
const dbModule = require('../../database');
const Joi = require('joi');

const asyncCatch = require('../../middleware/async-catch');
const joiValidate = require('../../middleware/joi-validate');

const router = express.Router();

const sendFriendRequestSchema = Joi.object({
  sender: Joi.object({
    id: Joi.string().required(),
    displayName: Joi.string().required(),
  }).required(),
  friend: Joi.object({
    id: Joi.string().required(),
    displayName: Joi.string().required(),
  }).required(),

  accepted: Joi.boolean().required(),
  cancelled: Joi.boolean().required(),
});

const cancelFriendRequestSchema = Joi.object({
  connectionOne: Joi.object({
    id: Joi.string().required(),
    displayName: Joi.string().required(),
  }).required(),
  connectionTwo: Joi.object({
    id: Joi.string().required(),
    displayName: Joi.string().required(),
  }),
});

const acceptFriendRequestSchema = Joi.object({
  connectionOne: Joi.object({
    id: Joi.string().required(),
    displayName: Joi.string().required(),
  }),
  connectionTwo: Joi.object({
    id: Joi.string().required(),
    displayName: Joi.string().required(),
  }),
});

const updateUnreadSchema = Joi.object({
  connectionId: Joi.string().required(),
  unreadCount: Joi.number(),
});

router.get(
  '/friend-list/:userId',
  asyncCatch(async (req, res, next) => {
    const userId = req.params.userId;
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

    res.status(200).json(uniqueRequests);
  })
);

router.get(
  '/sent-requests/:userId',
  asyncCatch(async (req, res, next) => {
    const userId = req.params.userId;

    const requests = await dbModule.findSentFriendRequests(userId);
    requests.sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    const mostRecentUniqueRequests = [];
    const uniqueRequests = [];

    for (request of requests) {
      if (!mostRecentUniqueRequests.includes(request.friend.id)) {
        mostRecentUniqueRequests.push(request.friend.id);
        uniqueRequests.push(request);
      }
    }

    res.status(200).json(uniqueRequests);
  })
);

router.put(
  '/send-request',
  joiValidate(sendFriendRequestSchema),
  asyncCatch(async (req, res, next) => {
    const io = req.app.get('io');
    // io.emit('test', 'testing send request')
    const friendRequest = req.body;
    const userId = req.body.sender?.id;
    const friendId = req.body.friend?.id;
    const existingFriend = await dbModule.findOneFriend(userId, friendId);
    console.log(existingFriend);
    if (friendId === userId) {
      res.status(400).json({ error: `Cannot friend request yourself` });
    }

    if (existingFriend && !existingFriend.removed) {
      res.status(400).json({ error: `Already friends with this person` });
    } else {
      await dbModule.insertFriendRequest(friendRequest);
      res.status(200).json({ msg: 'Friend Request sent!' });
    }
  })
);

router.put(
  '/cancel-request',
  joiValidate(cancelFriendRequestSchema),
  asyncCatch(async (req, res, next) => {
    const connectionData = req.body;

    await dbModule.cancelFriendRequests(connectionData.connectionOne.id, connectionData.connectionTwo.id);
    res.status(200).json({ message: 'Friend Request Canceled' });
  })
);

router.put(
  '/accept-request',
  joiValidate(acceptFriendRequestSchema),
  asyncCatch(async (req, res, next) => {
    const connectionData = req.body;

    const connectionOne = {
      userId: connectionData.connectionOne.id,
      friend: connectionData.connectionTwo,
      unReadCount: 0,
    };
    const connectionTwo = {
      userId: connectionData.connectionTwo.id,
      friend: connectionData.connectionOne,
      unReadCount: 0,
    };

    const existingFriend = await dbModule.findOneFriend(
      connectionData.connectionOne.id,
      connectionData.connectionTwo.id
    );
    
    if (connectionData.connectionOne.id === connectionData.connectionTwo.id) {
      res.status(400).json({ error: 'Cannot accept request from yourself' });
    }
    if (existingFriend && !existingFriend.removed) {
      res.status(400).json({ error: 'Friend already exists' });
    } else {
      await dbModule.insertNewFriendConnection(connectionOne);
      await dbModule.insertNewFriendConnection(connectionTwo);
      await dbModule.acceptFriendRequests(connectionData.connectionOne.id, connectionData.connectionTwo.id);

      res.status(200).json({ message: 'Friend added!' });
    }
  })
);

router.put(
  '/remove-friend',
  asyncCatch(async (req, res, next) => {
    const userId = req.body.userId;
    const friendId = req.body.friendId;

    if (friendId && userId) {
      await dbModule.removeFriendConnection(userId, friendId);
      await dbModule.removeFriendConnection(friendId, userId);
      res.status(200).json({ msg: 'friend Removed' });
    } else {
      res.status(400).json({ error: 'Error receiving ids' });
    }
  })
);

router.put(
  '/update-unread',
  joiValidate(updateUnreadSchema),
  asyncCatch(async (req, res, next) => {
    const update = req.body;
    console.log(update);
    const connectionId = update.connectionId;
    const unreadCount = update.unreadCount;
    if (connectionId) {
      await dbModule.updateUnreadConnectionMessages(connectionId, unreadCount);
      res.status(200).json({ message: 'hello' });
    } else {
      res.status(400).json({ error: 'id or unread count not provided' });
    }
  })
);

module.exports = router;
