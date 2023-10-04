const Sequelize = require("sequelize");
const sequelize = new Sequelize('eyewear', 'sa', '010203', {
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
db.Patient = require("./models/patient.model.js")(sequelize, Sequelize);

module.exports = db;