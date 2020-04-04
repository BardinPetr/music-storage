/* eslint-disable global-require */
let User;
let Song;
let Playlist;

module.exports = (sequelize) => {
  User = require('./user.js')(sequelize);
  Song = require('./song.js')(sequelize);

  User.belongsToMany(Song, {
    through: 'Playlists', as: 'songs',
  });
  Playlist = Song.belongsToMany(User, {
    through: 'Playlists', as: 'users',
  });
  return { User, Song, Playlist };
};