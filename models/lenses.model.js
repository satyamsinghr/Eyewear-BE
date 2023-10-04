module.exports = (sequelize, Sequelize) => {
  const Lenses = sequelize.define("Lenses", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    Lens_Status: {
      type: Sequelize.STRING,
      allowNull: false,
      // require : true
    },  
    Lens_Gender: {
      type: Sequelize.STRING,
      allowNull: false
    },
    Lens_Type: {
      type: Sequelize.STRING,
      allowNull: true
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
      allowNull: true
    },
    Box_Name: {
      type: Sequelize.STRING,
      allowNull: true
    },
    Is_Blocked: {
      type: Sequelize.BOOLEAN,
      allowNull: false
    },
    Is_Booked: {
      type: Sequelize.BOOLEAN,
      allowNull: false
    },
    Patient_id: {
      type: Sequelize.UUID,
      allowNull: true
    },
    Lens_ID: {
      type: Sequelize.STRING,
      allowNull: true
    },
    Box_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'boxes',
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
  return Lenses;
};