module.exports = (sequelize, Sequelize) => {
  const Session = sequelize.define("Session", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    UserId: {
      type: Sequelize.UUID,
      references: { 
        model: 'users',
        key: 'id'
      }
    },
    token: {
      type: Sequelize.STRING,
      allowNull: false
    }
  });
  return Session;
};