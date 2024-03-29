const express = require('express');
const dbModule = require('../../database');
const Joi = require('joi');

const asyncCatch = require('../../middleware/async-catch');
const joiValidate = require('../../middleware/joi-validate');

const router = express.Router();

const joinDirectChatSchema = Joi.object({
  id: Joi.string().required()
});

router.get(
  '/list',
  asyncCatch(async (req, res, next) => {
    console.log('fired');
    let { keyword } = req.query;

    const match = {};

    if (keyword) {
      match.$text = { $search: keyword };
    }

    const pipeline = [{ $match: match }];

    const db = await dbModule.connect();
    const cursor = db.collection('rooms').aggregate(pipeline);
    const results = await cursor.toArray();
    res.status(200).send(results);
  })
);

router.get(
  '/:roomId',
  asyncCatch(async (req, res, next) => {
    const roomId = req.params.roomId;
    const room = await dbModule.findOneRoom(roomId);
    if (room) {
      res.status(200).json(room);
    } else {
      res.status(404).json({ error: 'Room not found' });
    }
  })
);

router.put(
  '/join/direct-chat',
  joiValidate(joinDirectChatSchema),
  asyncCatch(async (req, res, next) => {
    const directChat = req.body;
    console.log(directChat.id);

    const chatExists = await dbModule.findDirectChatById(directChat.id);

    if (chatExists) {
      res.status(200).json({ message: 'room already exists' });
    } else {
      dbModule.insertDirectChatRoom(directChat.id);
      res.status(200).json({ message: 'creating new room' });
    }
  })
);

//Deprecated...
// router.put(
//   '/new',
//   asyncCatch(async (req, res, next) => {
//     const room = req.body;
//     console.log(room);

//     const roomExists = await dbModule.findRoomByName(room.name);

//     if (roomExists) {
//       res.status(400).json({ error: `Public room name "${room.name}" already exists` });
//     } else {
//       room._id = dbModule.newId();
//       // room.createdBy = {
//       //   _id: req.auth._id,
//       //   email: req.auth.email,
//       //   displayName: req.auth.displayName
//       // }

//       await dbModule.insertNewRoom(room);
//       res.status(200).json({
//         message: `New Room Created`,
//       });
//     }
//   })
// );

module.exports = router;
