const express = require('express');
const dbModule = require('../../database');

const asyncCatch = require('../../middleware/async-catch');

const router = express.Router();

router.get(
  '/list',
  asyncCatch(async (req, res, next) => {})
);

router.put(
  '/send-request',
  asyncCatch(async (req, res, next) => {
    
    const friendRequest = req.body;
    await dbModule.insertFriendRequest(friendRequest);
    res.status(200).json({ msg: 'Friend Request sent!'})
  })
);

//TODO Add update feature to add a removed flag! to cancel requests.

module.exports = router;
