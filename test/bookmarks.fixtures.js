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

module.exports = {
  makeBookmarksArray
};

