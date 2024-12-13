const Sequelize = require("sequelize");
// const sequelize = new Sequelize('eyewear', 'sa', 'admin@123', {
  const sequelize = new Sequelize('eyewear15march', 'sa', 'admin', {
    host: 'localhost',
    port: 1433,
    dialect: 'mssql'
  });

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require("./models/user.model.js")(sequelize, Sequelize);
db.Session = require("./models/session.model.js")(sequelize, Sequelize);
db.Collection = require("./models/collection.model.js")(sequelize, Sequelize);
db.Boxes = require("./models/boxes.model.js")(sequelize, Sequelize);
db.Lenses = require("./models/lenses.model.js")(sequelize, Sequelize);
db.SelectedReader = require("./models/selectedReader.model.js")(sequelize, Sequelize)
db.UserCollection = require("./models/userCollection.js")(sequelize, Sequelize)
db.Patient = require("./models/patient.model.js")(sequelize, Sequelize);
db.AlgoData = require("./models/algoData.model.js")(sequelize, Sequelize);
db.AxisConfig = require("./models/AxisConfig.model.js")(sequelize, Sequelize);
db.EyeWearConfig = require("./models/eyewearConfig.model.js")(sequelize, Sequelize);



// User.belongsToMany(Collection, { through: UserCollection });
// Collection.belongsToMany(User, { through: UserCollection });
module.exports = db;