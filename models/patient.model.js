module.exports = (sequelize, Sequelize) => {
  const Patient = sequelize.define("Patient", {
      id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          allowNull: false,
          primaryKey: true
      },
      firstName: {
          type: Sequelize.STRING,
          allowNull: false
      },
      lastName: {
          type: Sequelize.STRING,
          allowNull: false
      },
      email: {
          type: Sequelize.STRING,
          allowNull: false
      },
      Lens_Status: {
        type: Sequelize.STRING,
        allowNull: false
      },
      Lens_Gender: {
        type: Sequelize.STRING,
        allowNull: false
      },
      Lens_Type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      RSphere: {
        type: Sequelize.STRING,
        allowNull: false
      },
      RCylinder: {
        type: Sequelize.STRING,
        allowNull: false
      },
      RAxis: {
        type: Sequelize.STRING,
        allowNull: false
      },
      RAdd: {
        type: Sequelize.STRING,
        allowNull: false
      },
      LSphere: {
        type: Sequelize.STRING,
        allowNull: false
      },
      LCylinder: {
        type: Sequelize.STRING,
        allowNull: false
      },
      LAxis: {
        type: Sequelize.STRING,
        allowNull: false
      },
      LAdd: {
        type: Sequelize.STRING,
        allowNull: false
      },
      Lens_DTS: {
        type: Sequelize.STRING,
        allowNull: false
      },
      Lens_id: {
        type: Sequelize.UUID,
        references: {
          model: 'lenses',
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
  return Patient;
};