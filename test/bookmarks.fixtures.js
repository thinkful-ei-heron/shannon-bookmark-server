function makeBookmarksArray() {
  return [
    {
      id: 1,
      title: 'Imgur',
      url: 'https://www.imgur.com',
      description: 'browse doggos',
      rating: '4'
    },
    {
      id: 2,
      title: 'Google',
      url: 'https://www.google.com',
      description: 'browse web',
      rating: '3'
    },
    {
      id: 3,
      title: 'Gmail',
      url: 'https://www.gmail.com',
      description: 'browse messages',
      rating: '5'
    }
  ];
}

function makeMaliciousBookmark() {
  const maliciousBookmark = {
    id: 911,
    title: 'Naughty naughty very naughty <script>alert("xss");</script>',
    url: 'https://www.test.com',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    rating: '2'
  }
  const expectedBookmark = {
    ...maliciousBookmark,
    title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
  }
  return {
    maliciousBookmark,
    expectedBookmark,
  }
}


module.exports = {
  makeBookmarksArray,
  makeMaliciousBookmark
};

