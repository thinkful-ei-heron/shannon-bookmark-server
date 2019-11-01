const express = require('express');
const bookmarksRouter = express.Router();
const bookmarks = require('../store');


bookmarksRouter
  .route('/')
  .get((req, res) => {
    return res
      .status(200)
      .json(bookmarks);
  })
  .post((req, res) => {
    return res
      .status(201)
      .json({ message: 'post request received' });
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