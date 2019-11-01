const express = require('express');
const bookmarksRouter = express.Router();
const bookmarks = require('../store');
const bodyParser = express.json();
const logger = require('../logger');
const uuid = require('uuid/v4');
const { PORT } = require('../config');



bookmarksRouter
  .route('/')
  .get((req, res) => {
    return res
      .status(200)
      .json(bookmarks);
  })
  .post(bodyParser, (req, res) => {
    const { title, url, description, rating} = req.body;
    const rate = parseFloat(rating);

    if(!title || !url || !description || !rating) {
      logger.info('Required data is missing.');
      return res
        .status(400)
        .json({error: 'Required data is missing. Must provide: title, url, description, and rating'});
    }
    if(!url.startsWith('http')){
      logger.info(`Url: ${url} is invalid.`);
      return res
        .status(400)
        .json({error: 'Please supply a valid URL'});
    }
    if(Number.isNaN(rate) || rate < 1 || rate > 5 ){
      logger.info(`Rating must be a number between 1 and 5. Rating= ${rate}`);
      return res
        .status(400)
        .json({error: 'Rating must be a number between 1 and 5'});
    }
    const id = uuid();
    const newBookmark = {
      id,
      title,
      url,
      description,
      rating: rate,
    };
    bookmarks.push(newBookmark);
    console.log(bookmarks);
    return res
      .status(201)
      .location(`http://localhost:${PORT}/bookmarks/${id}`)
      .json(newBookmark);
  });

bookmarksRouter
  .route('/:id')
  .get((req, res) => {
    return res
      .status(200)
      .json({ message: `GET request received. Params: ${req.params.id}` });
  })
  .delete((req, res) => {
    return res
      .status(200)
      .json({message: `delete request received. Params: ${req.params.id}`});
  });



module.exports = bookmarksRouter;