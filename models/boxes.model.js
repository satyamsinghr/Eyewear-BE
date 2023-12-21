module.exports = (sequelize, Sequelize) => {
  const Boxes = sequelize.define("Boxes", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    Box_id: {
      type: Sequelize.STRING,
      allowNull: false
    },
    Col_type: {
      type: Sequelize.STRING,
      allowNull: false
    },
    Box_date: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW(),
    },
    Box_Name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    Coll_id: {
      type: Sequelize.UUID,
      references: {
        model: 'collections',
        key: 'id'
      }
    },
    UserId: {
      type: Sequelize.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  });
  return Boxes;
};