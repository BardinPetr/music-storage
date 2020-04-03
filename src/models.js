const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('sqlite::memory:');

const User = sequelize.define('user',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  },
  {});

const Composition = sequelize.define('user',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
  },
  {});

User.belongsToMany(Composition, { through: 'Playlists' });
Composition.belongsToMany(User, { through: 'Playlists' });

module.exports = {
  User, Composition,
};