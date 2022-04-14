const express = require('express');
const dbModule = require('../../database');

const asyncCatch = require('../../middleware/async-catch');

const router = express.Router();

router.get('/:roomId/comment/list',
  asyncCatch(async (req, res, next) => {
    const roomId = req.params.roomId;

    const comments = await dbModule.findRoomsComments(roomId);
    
    res.status(200).json(comments);
  })
)

module.exports = router;