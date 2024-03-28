const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const app = express();

const axisConfigSeedData = require('./utils/axisConfig')
const eyeWearConfigSeedData = require('./utils/eyewearConfig')
// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
const db = require("./connect");
const User = db.User;
const Collection = db.Collection;
const UserCollection = db.UserCollection;
const EyeWearConfig = db.EyeWearConfig;
const AxisConfig = db.AxisConfig;
// db.sequelize.sync({ force: true }).then(() => {
//   console.log("Drop and re-sync db.");
// });
app.use(
  cors({
    // origin: "http://localhost:3000",
    origin: "*",
  })
);
// Sync the database with migrations
db.sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Database synchronized.");
    // Create the initial user after syncing the database
    createInitialUser();
    createInitialEyewearConfig();
    createInitialAxisConfig();

    createAssociations();
  })
  .catch((err) => {
    console.error("Error syncing database:", err);
  });

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to eyeglasses application." });
});
require("./database_access")(app);
// set port, listen for requests
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

async function createAssociations() {
  // User.belongsToMany(Collection, { through: UserCollection });
  // Collection.belongsToMany(User, { through: UserCollection });
  User.belongsToMany(Collection, { through: UserCollection, foreignKey: 'userId', otherKey: 'Coll_id' });
Collection.belongsToMany(User, { through: UserCollection, foreignKey: 'Coll_id', otherKey: 'userId' });
}

// Function to create a new user
async function createInitialUser() {
  try {
    const existingUser = await User.findOne({ where: { email: "admin@hopefulways.com" } });

    if (!existingUser) {
      await User.create({
        firstName: "admin",
        lastName: "admin",
        email: "admin@hopefulways.com",
        password: bcrypt.hashSync("Admin@123", 8), // Hash this password in a real application
        role: "1" //for super admin 2 for admin,
      });

      console.log("Initial user created successfully.");
    } else {
      console.log("Initial user already exists.");
    }
  } catch (error) {
    console.error("Error creating initial user:", error);
  }
}


// Function to create a new config for lens and axis
async function createInitialEyewearConfig() {
  try {
    console.log('EyeWearConfig', EyeWearConfig);
    const existing = await EyeWearConfig.findAll();

    if (existing.length === 0) {
      await EyeWearConfig.bulkCreate(eyeWearConfigSeedData);

      console.log("Initial configuration successfully.");
    } else {
      console.log("Initial configuration already exists.");
    }
  } catch (error) {
    console.error("Error creating initial configuration:", error);
  }
}

// Function to create a new config for lens and axis
async function createInitialAxisConfig() {
  try {
    console.log('AxisConfig', AxisConfig);
    const existing = await AxisConfig.findAll();

    if (existing.length === 0) {
      await AxisConfig.bulkCreate(axisConfigSeedData);

      console.log("Initial configuration successfully.");
    } else {
      console.log("Initial configuration already exists.");
    }
  } catch (error) {
    console.error("Error creating initial configuration:", error);
  }
}