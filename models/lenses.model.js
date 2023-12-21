module.exports = (sequelize, Sequelize) => {
  const Lenses = sequelize.define("Lenses", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    lensId: {
      type: Sequelize.STRING,
      allowNull: false,
    },  
    Lens_Status: {
      type: Sequelize.STRING,
      allowNull: true,
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
    Box_Name: {
      type: Sequelize.STRING,
      allowNull: true
    },
    Is_Blocked: {
      type: Sequelize.BOOLEAN,
      allowNull: true
    },
    Is_Booked: {
      type: Sequelize.BOOLEAN,
      allowNull: true
    },
    Patient_id: {
      type: Sequelize.UUID,
      allowNull: true
    },
    Lens_ID: {
      type: Sequelize.STRING,
      allowNull: true
    },
    LLBIF: {
      type: Sequelize.STRING,
      allowNull: true
    },
    LRBIF: {
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
    },
    returned: {
      type: Sequelize.UUID,
      
    },
    dispense: {
      type: Sequelize.UUID,
      
    }
  });
  return Lenses;
};