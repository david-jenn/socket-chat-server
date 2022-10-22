require('dotenv').config();
const express = require('express');
const dbModule = require('../../database');
const bcrypt = require('bcrypt');
const asyncCatch = require('../../middleware/async-catch');
const jwt = require('jsonwebtoken');

const Joi = require('joi');
const joiValidate = require('../../middleware/joi-validate');

//schema

const registerUserSchema = Joi.object({
  email: Joi.string().trim().min(3).email().required(),
  displayName: Joi.string().trim().min(3).required(),
  password: Joi.string().trim().min(8).required(),
  fullName: Joi.string().trim().min(2).required(),
});

const loginUserSchema = Joi.object({
  email: Joi.string().trim().required(),
  password: Joi.string().trim().required(),
});

async function issueToken(user) {
  const authPayload = {
    _id: user._id,
    displayName: user.displayName,
    email: user.email,
  };

  const authSecret = process.env.AUTH_SECRET;
  const authOptions = { expiresIn: '24hr' };
  const authToken = jwt.sign(authPayload, authSecret, authOptions);
  return authToken;
}

function sendCookie(res, authToken) {
  const cookieOptions = { httpOnly: true, maxAge: 14400000 };
  res.cookie('authToken', authToken, cookieOptions);
}
4;
const router = express.Router();

//routes

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
    const cursor = db.collection('user').aggregate(pipeline);
    const results = await cursor.toArray();
    res.status(200).send(results);
  })
);

router.get(
  '/:userId',
  asyncCatch(async (req, res, next) => {
    
    const userId = req.params.userId;
    const userIdObject = dbModule.newId(userId);
    const user = await dbModule.findUserById(userIdObject);
    
    if(!user) {
      res.status(404).json({error: 'User not found'});
    } else {
      res.status(200).json(user);
    }

  })
);

router.post(
  '/register',
  joiValidate(registerUserSchema),
  asyncCatch(async (req, res, next) => {
    const user = req.body;
    
    user._id = dbModule.newId();
    user.createdDate = new Date();

    //hash password
    const saltRounds = 10;
    user.password = await bcrypt.hash(user.password, saltRounds);

    const emailExists = await dbModule.findUserByEmail(user.email);
    const displayNameExists = await dbModule.findUserByDisplayName(user.displayName);

    if (emailExists) {
      res.status(400).json({
        error: `Email ${user.email} already registered`,
      });
    } else if (displayNameExists) {
      res.status(400).json({
        error: `Display name ${user.displayName} already registered`,
      });
    } else {
      const authToken = await issueToken(user);
      sendCookie(res, authToken);
      await dbModule.insertOneUser(user);

      res.status(200).json({
        success: 'New User Registered',
        userId: user._id,
        token: authToken,
      });
    }
  })
);

router.post(
  '/login',
  joiValidate(loginUserSchema),
  asyncCatch(async (req, res, next) => {
    const { email, password } = req.body;

    const user = await dbModule.findUserByEmail(email);

    if (user && (await bcrypt.compare(password, user.password))) {
      const authToken = await issueToken(user);
      sendCookie(res, authToken);

      res.json({ message: 'Welcome back ', userId: user._id, token: authToken });
    } else {
      res.status(400).json({
        error: 'Invalid Login Credentials',
      });
    }
  })
);

module.exports = router;
