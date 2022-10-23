const express = require('express');
const dbModule = require('../../database');
const Joi = require('joi');

const asyncCatch = require('../../middleware/async-catch');
const joiValidate = require('../../middleware/joi-validate');
const router = express.Router();

const newCommentSchema = Joi.object({
  userId: Joi.string().required(),
  displayName: Joi.string().required(),
  room: Joi.string().required(),
  msg: Joi.string().required()
})

router.get('/:roomId/list',
  asyncCatch(async (req, res, next) => {
    const roomId = req.params.roomId;

    const comments = await dbModule.findRoomsComments(roomId);
    console.log("grabbing from db")
    
    res.status(200).json(comments);
  })
)

router.put('/new',
  joiValidate(newCommentSchema),
  asyncCatch(async (req, res, next) => {
    const comment = req.body;

    await dbModule.insertOneComment(comment);
   
    
    res.status(200).json({message: "comment inserted"});
  })
)

module.exports = router;
