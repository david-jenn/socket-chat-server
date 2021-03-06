const express = require('express');
const dbModule = require('../../database');

const asyncCatch = require('../../middleware/async-catch');

const router = express.Router();

router.get('/:roomId/list',
  asyncCatch(async (req, res, next) => {
    const roomId = req.params.roomId;

    const comments = await dbModule.findRoomsComments(roomId);
    console.log("grabbing from db")
    
    res.status(200).json(comments);
  })
)

router.put('/new',
  asyncCatch(async (req, res, next) => {
    const roomId = req.params.roomId;

    const comment = {
      username:"Test User",
      message: "This is a test of inserting comments",
      room: "abc",
      date: new Date()
    }

    await dbModule.insertOneComment(comment);
   
    
    res.status(200).json({message: "comment inserted"});
  })
)

module.exports = router;
