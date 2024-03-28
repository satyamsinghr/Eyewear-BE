module.exports = (sequelize, Sequelize) => {
    const SelectedReader = sequelize.define("SelectedReader", {
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
      Patient_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      CollectionId: {
        type: Sequelize.UUID,
        allowNull: true,
        // references: {
        //   model: 'collections',
        //   key: 'id'
        // }
      },
    });
    SelectedReader.belongsTo(sequelize.models.Collection, { foreignKey: 'CollectionId' });
    return SelectedReader;
  };