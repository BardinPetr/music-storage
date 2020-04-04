const { Sequelize, DataTypes, Model } = require('sequelize');


module.exports = (sequelize) => {
  class User extends Model { }
  User.init(
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
    }, { sequelize, modelName: 'user' },
  );
  return User;
};