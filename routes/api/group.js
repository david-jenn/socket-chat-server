const express = require('express');
const dbModule = require('../../database');

const asyncCatch = require('../../middleware/async-catch');
const joiValidate = require('../../middleware/joi-validate');


const router = express.Router();

router.put('/create-group', asyncCatch(async (req, res, next) => {

  const data = req.body;

  const groupId = dbModule.newId();
  
  const group = {
    _id: groupId,
    name: data.groupName,
    createdDate: new Date(),
    createdBy: data.user,

  }
  
  const connection = {
    group: group,
    user: data.user,
  }


  await dbModule.insertOneGroup(group);
  await dbModule.insertOneGroupConnection(connection);
  res.status(200).json({msg: 'Group Created!'});
}))






module.exports = router;