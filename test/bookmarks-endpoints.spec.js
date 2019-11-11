const knex = require('knex');
const app = require('../src/app');
const { makeBookmarksArray, makeMaliciousBookmark } = require('./bookmarks.fixtures');


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
          .get('/api/bookmarks')
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(200, []);
      });

      it('returns a 400 error when no authorization is supplied', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .expect(400, { error: 'Invalid Authorization' });
      });

      it('returns a 400 error when wrong authorization is supplied', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .set('Authorization', process.env.API_TOKEN)
          .expect(400, { error: 'Invalid Authorization' });
      });

      it('returns a 404 status and an error when trying to get a bookmark by id with no data present', () => {
        return supertest(app)
          .get('/api/bookmarks/1')
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
          .get('/api/bookmarks')
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(200, testBookmarks);
      });

      it('returns a 200 status and a single bookmark based on id', () => {
        const bookmarkId = 2;
        const expectedBookmark = testBookmarks[bookmarkId - 1];
        return supertest(app)
          .get(`/api/bookmarks/${bookmarkId}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(200, expectedBookmark);
      });

      it('returns a 404 status and an error when trying to get a bookmark by id that doesn\'t exist', () => {
        return supertest(app)
          .get('/api/bookmarks/-123')
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
        .post('/api/bookmarks')
        .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
        .send(testBookmark)
        .expect(201)
        .expect(actual => {
          const assignedId = actual.body.id;
          expect(actual.body).to.eql({
            ...testBookmark,
            id: assignedId
          })
          expect(actual.headers.location).to.eql(`/api/bookmarks/${assignedId}`);
        })
        .then((res) => {
          return supertest(app)
            .get('/api/bookmarks')
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
          .post('/api/bookmarks')
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .send(newBookmarkTest)
          .expect(400, { error: 'Required data is missing. Must provide: title, url, description, and rating' })
      });

    });

    it('responds with 400 and an error when the correct url format is not used', () => {
      return supertest(app)
        .post('/api/bookmarks')
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
        .post('/api/bookmarks')
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
          .delete(`/api/bookmarks/${bookmarkIdToDelete}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(204)
          .then(res => {
            return supertest(app)
              .get('/api/bookmarks')
              .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
              .expect(200, expectedBookmarks);
          })
      })
    })
    context('given no bookmarks', () => {
      it('responds with 404 not found when trying to delete bookmark with non-existent id', () => {
        const bookmarkIdToDelete = 123456789
        return supertest(app)
          .delete(`/api/bookmarks/${bookmarkIdToDelete}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(404, { error: 'Cannot find bookmark with matching id' })
      })
    })

  });
  describe('XSS attacks', () => {
    context('Given an XSS attack bookmark is already present', () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

      beforeEach('insert malicious bookmark', () => {
        return db
          .into('bookmarks')
          .insert(maliciousBookmark)
      });

      it('removes XSS attack content for specific bookmark', () => {
        return supertest(app)
          .get(`/api/bookmarks/${maliciousBookmark.id}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(200, expectedBookmark)
      })

      it('removes XSS attack content for all bookmarks', () => {
        return supertest(app)
          .get(`/api/bookmarks`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(200)
          .expect(res => {
            expect(res.body[0].title).to.eql(expectedBookmark.title);
            expect(res.body[0].description).to.eql(expectedBookmark.description);
          });
      })
    })
    context('given we are posting an attack bookmark', () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

      it('removes xss attack for posted bookmark', () => {
        return supertest(app)
          .post('/api/bookmarks')
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .send(maliciousBookmark)
          .expect(201)
          .expect(res => {
            expect(res.body.title).to.eql(expectedBookmark.title);
            expect(res.body.description).to.eql(expectedBookmark.description);
          })
      })
    })
  })

  describe('PATCH requests', () => {
    context('given we are trying to update an existing bookmark', () => {
      const testBookmarks = makeBookmarksArray();
      beforeEach('insert data', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      });

      it('updates bookmark correctly', () => {
        const bookmarkIdToUpdate = 1;
        const newData = {
          title: 'Imgur Rocks',
          rating: '5',
          irrelevantField: 'irrelevant'
        }
        const expectedResult = {
          ...testBookmarks[bookmarkIdToUpdate - 1],
          ...newData
        }
        return supertest(app)
          .patch(`/api/bookmarks/${bookmarkIdToUpdate}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .send(newData)
          .expect(204)
          .expect(() => {
            return supertest(app)
              .get(`/api/bookmarks/${bookmarkIdToUpdate}`)
              .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
              .expect(expectedResult)
          })
      })

      it('throws an error when trying to update only fields that do not exist', () => {
        const bookmarkIdToUpdate = 1;
        const newData = {
          irrelevantField: 'irrelevant'
        }
        return supertest(app)
          .patch(`/api/bookmarks/${bookmarkIdToUpdate}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(400, {error: { message: 'fields to update must include title, rating, url, or description' }})
      });

      it('throws an error when attempting to PATCH without an id', () => {
        return supertest(app)
          .patch('/api/bookmarks/')
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(404, { error: { message: 'must provide a bookmark id to update content' } })
      })

    });





  })
});