module.exports = (sequelize, Sequelize) => {
    const AlgoData = sequelize.define("AlgoData", {
      Id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      WC: {
        type: Sequelize.STRING,
        allowNull: false
      },
      WS: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      WA: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      WB: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      WMR: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      WML: {
        type: Sequelize.STRING,
        allowNull: false,
      }
    },
    {
      timestamps: false // Disable timestamps
    }
    );
    return AlgoData;
  };