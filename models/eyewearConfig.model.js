module.exports = (sequelize, Sequelize) => {
  const EyeWearConfig = sequelize.define("EyeWearConfig", {
    Id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    NewValue: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    CurrentValue: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    Parameters: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    Description: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  });
  return EyeWearConfig;
};
