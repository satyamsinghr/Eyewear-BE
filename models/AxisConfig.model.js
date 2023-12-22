module.exports = (sequelize, Sequelize) => {
  const AxisConfig = sequelize.define("AxisConfig", {
    Id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    NewAxisMin: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    NewAxisMax: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    CurrentAxisMin: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    CurrentAxisMax: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    CylMin: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    CylMax: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  });
  return AxisConfig;
};
