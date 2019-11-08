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
          .expect(400, { error: 'Invalid Authorization' });
      });

      it('returns a 400 error when wrong authorization is supplied', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', process.env.API_TOKEN)
          .expect(400, { error: 'Invalid Authorization' });
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
        const expectedBookmark = testBookmarks[bookmarkId - 1];
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

  describe('POST', () => {
    const testBookmark = {
      title: 'myTestWebsite',
      url: 'https://www.test.com',
      description: 'test new bookmark',
      rating: '4'
    };
    it('creates a bookmark and responds with 201, location header, and the new bookmark', () => {
      return supertest(app)
        .post('/bookmarks')
        .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
        .send(testBookmark)
        .expect(201)
        .expect(actual => {
          const assignedId = actual.body.id;
          expect(actual.body).to.eql({
            ...testBookmark,
            id: assignedId
          })
          expect(actual.headers.location).to.eql(`/bookmarks/${assignedId}`);
        })
        .then((res) => {
          return supertest(app)
            .get('/bookmarks')
            .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
            .expect(200)
            .expect(res => {
              expect(res.body).to.have.lengthOf(1);
              expect(res.body).to.be.an('array');
              expect(res.body[0]).to.include.all.keys(
                'title', 'url', 'description', 'id', 'rating'
              )
            })
        });
    });

    const requiredFields = ['title', 'url', 'description', 'rating'];
    requiredFields.forEach(field => {
      const newBookmarkTest = {
        title: 'myTestWebsite',
        url: 'https://www.test.com',
        description: 'test new bookmark',
        rating: '4'
      }
      it('responds with a 400 error and error message when a field is missing', () => {
        delete newBookmarkTest[field];
        return supertest(app)
          .post('/bookmarks')
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .send(newBookmarkTest)
          .expect(400, { error: 'Required data is missing. Must provide: title, url, description, and rating' })
      });

    });

    it('responds with 400 and an error when the correct url format is not used', () => {
      return supertest(app)
        .post('/bookmarks')
        .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
        .send({
          title: 'myTestWebsite',
          url: 'www.test.com',
          description: 'test new bookmark',
          rating: '4'
        })
        .expect(400, { error: 'Please supply a valid URL' })
    });

    it('responds with 400 and an error when a number is not supplied for rating', () => {
      return supertest(app)
        .post('/bookmarks')
        .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
        .send({
          title: 'myTestWebsite',
          url: 'https://www.test.com',
          description: 'test new bookmark',
          rating: 'four'
        })
        .expect(400, { error: 'Rating must be a number between 1 and 5' })
    });

  });


  describe('DELETE /bookmarks/:bookmarkID', () => {
    context('given bookmarks present', () => {
      const testBookmarks = makeBookmarksArray();
      beforeEach('insert data', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });

      it('responds with 204 when appropriate id is supplied to delete, deletes bookmark', () => {
        const bookmarkIdToDelete = 2;
        const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== bookmarkIdToDelete);
        return supertest(app)
          .delete(`/bookmarks/${bookmarkIdToDelete}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(204)
          .then(res => {
            return supertest(app)
              .get('/bookmarks')
              .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
              .expect(200, expectedBookmarks);
          })
      })
    })
    context('given no bookmarks', () => {
      it('responds with 404 not found when trying to delete bookmark with non-existent id', () => {
        const bookmarkIdToDelete = 123456789
        return supertest(app)
          .delete(`/bookmarks/${bookmarkIdToDelete}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(404, { error: 'Cannot find bookmark with matching id' })
      })
    })

  });

});