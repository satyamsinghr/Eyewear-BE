const Collection = require("./collection.model");
module.exports = (sequelize, Sequelize) => {
    const UserCollection = sequelize.define("UserCollection", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true
      },
      Coll_Id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        // references: {
        //     model: Collection,
        //     key: 'id'
        //   }
      },
    });
    
    UserCollection.associate = (models) => {
    UserCollection.belongsTo(models.User, { foreignKey: 'userId' });
  };
    return UserCollection;
  };