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
  }



};

module.exports = BookmarksService;