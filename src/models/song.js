const { Sequelize, DataTypes, Model } = require('sequelize');


module.exports = (sequelize) => {
  class Song extends Model { }
  Song.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      ext: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    }, { sequelize, modelName: 'song' },
  );
  return Song;
};