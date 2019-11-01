require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV, API_TOKEN } = require('./config');
const logger = require('./logger');
const bookmarksRouter = require('./bookmarks/bookmarks-router');

const app = express();

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'dev';
app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());
app.use(function validateBearerToken(req, res, next){
  const authToken = req.get('Authorization');
  if (!authToken || authToken.split(' ')[0] !== 'Bearer' || authToken.split(' ')[1] !== API_TOKEN) {
    logger.info(`Authorization failed, user supplied the following authToken: ${authToken ? authToken : 'No Token Supplied'}`);
    return res
      .status(400)
      .json({error: 'Invalid Authorization'});
  } 
  next();
});
app.use('/bookmarks', bookmarksRouter);


app.use(function errorHandler(error, req, res, next ){
  let response;
  if (NODE_ENV === 'production') {
    response = { error: { message : 'server error' } };
  } else {
    console.error(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});

module.exports = app;