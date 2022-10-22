const Joi = require('joi');


function joiValidate(schema) {
  return (req, res, next) => {
    console.log('validating....')
    const validateRequest = schema.validate(req.body, {abortEarly: true});
    if(validateRequest.error) {
      console.log(validateRequest.error);
      return res.status(400).json({error: validateRequest.error});
    } else {
      req.body = validateRequest.value;
      return next();
    }
  }
}

module.exports = joiValidate;