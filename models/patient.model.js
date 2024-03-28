module.exports = (sequelize, Sequelize) => {
  const Patient = sequelize.define("Patient", {
      id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          allowNull: false,
          primaryKey: true
      },
      PatientId: {
        type: Sequelize.STRING,
        allowNull: false,
      }, 
      CollectionId: {
        type: Sequelize.UUID,
        allowNull: true,
        // references: {
        //   model: 'collections',
        //   key: 'id'
        // }
      }, 
      Percentage: {
        type: Sequelize.STRING,
        allowNull: true,
      }, 
      firstName: {
          type: Sequelize.STRING,
          allowNull: true
      },
      lastName: {
          type: Sequelize.STRING,
          allowNull: true
      },
      email: {
          type: Sequelize.STRING,
          allowNull: true
      },
      Lens_Status: {
        type: Sequelize.STRING,
        allowNull: true
      },
      Lens_Gender: {
        type: Sequelize.STRING,
        allowNull: true
      },
      Lens_Type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      RSphere: {
        type: Sequelize.STRING,
        allowNull: true
      },
      RCylinder: {
        type: Sequelize.STRING,
        allowNull: true
      },
      RAxis: {
        type: Sequelize.STRING,
        allowNull: true
      },
      RAdd: {
        type: Sequelize.STRING,
        allowNull: true
      },
      LSphere: {
        type: Sequelize.STRING,
        allowNull: true
      },
      LCylinder: {
        type: Sequelize.STRING,
        allowNull: true
      },
      LAxis: {
        type: Sequelize.STRING,
        allowNull: true
      },
      LAdd: {
        type: Sequelize.STRING,
        allowNull: true
      },
      Lens_DTS: {
        type: Sequelize.STRING,
        allowNull: true
      },
      Lens_id: {
        type: Sequelize.UUID,
        references: {
          model: 'lenses',
          key: 'id'
        }
      },
      LBIF: {
        type: Sequelize.STRING,
        allowNull: true
      },
      RBIF: {
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
  Patient.belongsTo(sequelize.models.Collection, { foreignKey: 'CollectionId' });
  return Patient;
};