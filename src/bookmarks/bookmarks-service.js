const BookmarksService = {

  getAllBookmarks(db) {
    return db('bookmarks')
      .select('*');
  },

  getBookmarkById(db, id) {
    return db('bookmarks')
      .select('*')
      .where({ id })
      .first();
  },

  postNewBookmark(db, newBookmarkData) {
    return db
      .insert(newBookmarkData)
      .into('bookmarks')
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },

  deleteBookmark(db, id) {
    return db('bookmarks')
      .where({id})
      .delete();
  }

};

module.exports = BookmarksService;