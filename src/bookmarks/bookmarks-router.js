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
    const { title, url, desc, rating} = req.body;
    const rate = parseFloat(rating);

    if(!title || !url || !desc || !rating) {
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
      desc,
      rating: rate,
    };
    bookmarks.push(newBookmark);
    return res
      .status(201)
      .location(`http://localhost:${PORT}/bookmarks/${id}`)
      .json(newBookmark);
  });

bookmarksRouter
  .route('/:id')
  .get((req, res) => {
    const { id } = req.params;
    
    const bookmark = bookmarks.find(item => item.id === id);
    if(!bookmark) {
      logger.info('Cannot find bookmark with that id');
      return res
        .status(404)
        .json({error:'Cannot find bookmark with matching id'});
    }
    return res
      .status(200)
      .json(bookmark);
  })
  .delete((req, res) => {
    const { id } = req.params;
    const bookmarkIndex = bookmarks.findIndex(item => item.id === id);
    if(bookmarkIndex === -1) {
      logger.info('Cannot find bookmark with that id');
      return res
        .status(404)
        .json({error:'Cannot find bookmark with matching id'});
    }
    bookmarks.splice(bookmarkIndex, 1);
    logger.info(`Bookmark with id of: ${id} deleted`);
    return res
      .status(204)
      .end();
  });



module.exports = bookmarksRouter;