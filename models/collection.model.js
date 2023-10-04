module.exports = (sequelize, Sequelize) => {
  const Collection = sequelize.define("Collection", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    Coll_name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    Coll_desc: {
      type: Sequelize.STRING,
      allowNull: false
    },
    Coll_date: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW(),
    },
    Coll_boxes: {
      type: Sequelize.STRING,
      allowNull: true
    },
    UserId: {
      type: Sequelize.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  });
  return Collection;
};