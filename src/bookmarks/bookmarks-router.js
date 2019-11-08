const express = require('express');
const bookmarksRouter = express.Router();
const bodyParser = express.json();
const logger = require('../logger');
const { PORT } = require('../config');
const BookmarksService = require('./bookmarks-service');
const xss = require('xss');

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: xss(bookmark.url),
  description: xss(bookmark.description),
  rating: bookmark.rating
});

bookmarksRouter
  .route('/')
  .get((req, res) => {
    const knexInstance = req.app.get('db');
    BookmarksService.getAllBookmarks(knexInstance)
      .then(bookmarks => {
        return res.status(200).json(bookmarks.map(serializeBookmark)
        );
      });
  })
  .post(bodyParser, (req, res) => {
    const knexInstance = req.app.get('db');
    const { title, url, description, rating } = req.body;
    const rate = parseFloat(rating);

    if (!title || !url || !description || !rating) {
      logger.info('Required data is missing.');
      return res
        .status(400)
        .json({ error: 'Required data is missing. Must provide: title, url, description, and rating' });
    }
    if (!url.startsWith('http')) {
      logger.info(`Url: ${url} is invalid.`);
      return res
        .status(400)
        .json({ error: 'Please supply a valid URL' });
    }
    if (Number.isNaN(rate) || rate < 1 || rate > 5) {
      logger.info(`Rating must be a number between 1 and 5. Rating= ${rate}`);
      return res
        .status(400)
        .json({ error: 'Rating must be a number between 1 and 5' });
    }
    const newBookmark = {
      title: xss(title),
      url: xss(url),
      description: xss(description),
      rating: rate,
    };
    BookmarksService.postNewBookmark(knexInstance, newBookmark)
      .then(bookmark => {
        return res
          .status(201)
          .location(`/bookmarks/${bookmark.id}`)
          .json(serializeBookmark(bookmark));
      });

  });

bookmarksRouter
  .route('/:id')
  .all((req, res, next) => {
    const knexInstance = req.app.get('db');
    const id = req.params.id;

    BookmarksService.getBookmarkById(knexInstance, id)
      .then(bookmark => {
        if (!bookmark) {
          logger.info('Cannot find bookmark with that id');
          return res
            .status(404)
            .json({ error: 'Cannot find bookmark with matching id' });
        }
        res.bookmark = bookmark;
        next();
        return null;
      })
      .catch(next);
  })
  .get((req, res) => {
    return res.status(200).json(serializeBookmark(res.bookmark));
  })
  .delete((req, res) => {
    const knexInstance = req.app.get('db');
    const { id } = req.params;
    BookmarksService.deleteBookmark(knexInstance, id)
      .then(() => {
        logger.info(`Bookmark with id of: ${id} deleted`);
        return res
          .status(204)
          .end();
      });
  });



module.exports = bookmarksRouter;