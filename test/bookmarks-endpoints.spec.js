const knex = require('knex');
const app = require('../src/app');
const { makeBookmarksArray } = require('./bookmarks.fixtures');


describe('Bookmark Endpoints', () => {
  let db;
  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());
  before('clean the table', () => db('bookmarks').truncate());
  afterEach('cleanup', () => db('bookmarks').truncate());

  describe('GET /articles', () => {

    context('if no bookmarks are present', () => {
      it('returns a 200 status and an empty list', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(200, []);
      });

      it('returns a 400 error when no authorization is supplied', () => {
        return supertest(app)
          .get('/bookmarks')
          .expect(400, {error: 'Invalid Authorization'});
      });

      it('returns a 400 error when wrong authorization is supplied', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', process.env.API_TOKEN)
          .expect(400, {error: 'Invalid Authorization'});
      });

      it('returns a 404 status and an error when trying to get a bookmark by id with no data present', () => {
        return supertest(app)
          .get('/bookmarks/1')
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(404, { error: 'Cannot find bookmark with matching id' });
      });

    });

    context('if bookmarks are present', () => {
      const testBookmarks = makeBookmarksArray();
      beforeEach('insert data', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });


      it('returns a 200 status and an array of all bookmarks', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(200, testBookmarks);
      });

      it('returns a 200 status and a single bookmark based on id', () => {
        const bookmarkId = 2;
        const expectedBookmark = testBookmarks[bookmarkId -1];
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(200, expectedBookmark);
      });

      it('returns a 404 status and an error when trying to get a bookmark by id that doesn\'t exist', () => {
        return supertest(app)
          .get('/bookmarks/-123')
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(404, { error: 'Cannot find bookmark with matching id' });
      });


    });


  });

});