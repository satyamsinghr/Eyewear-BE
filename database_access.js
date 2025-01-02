module.exports = (app) => {
  const db = require("./connect");
  const User = db.User;
  const UserLoginSession = db.Session;
  const Sequelize = require("sequelize");
  const { Op } = require("sequelize");
  const Collection = db.Collection;
  const Boxes = db.Boxes;
  const Lenses = db.Lenses;
  const SelectedReader = db.SelectedReader;
  const UserCollection = db.UserCollection;
  const Patient = db.Patient;
  const AlgoData = db.AlgoData;
  const EyeWearConfig = db.EyeWearConfig;
  const AxisConfig = db.AxisConfig;
  const moment = require('moment');

  const jwt = require("jsonwebtoken");
  const bcrypt = require("bcryptjs");

  const express = require("express");
  const router = express.Router();
  const csv = require("csv-parser");
  const xlsx = require("xlsx");
  const multer = require("multer");

  const Readable = require("stream").Readable;
  // Configure storage destination and file naming
  // const storage = multer.diskStorage({
  //     destination: (req, file, cb) => {
  //         cb(null, 'uploads/') // Specify the directory where files will be stored
  //     },
  //     filename: (req, file, cb) => {
  //         cb(null, file.originalname)
  //     }
  // });


  // this method will be validating jwt token that we will create at the time of login
  // after login in every api we need to send the generated token in Authorization header key even while signOut
  const verifyToken = async (req, res, next) => {
    try {
      let tokenData;
      console.log(req.headers.authorization)
      tokenData = await UserLoginSession.findOne({
        where: { token: req.headers.authorization },
      });
      console.log("tokenDatatokenData", tokenData)
      if (!tokenData) {
        return res.status(401).send({
          message: "No token provided!",
        });
      }
      console.log("tokenData", tokenData)
      jwt.verify(tokenData.token, "SecretKeyForEyeGlasses", (err, decoded) => {
        if (err) {
          return res.status(401).send({
            message: "Unauthorized!",
          });
        }
        req.email = decoded.id;
        next();
      });
    } catch (error) {
      console.error("Error retrieving token from database:", error);
      return res.status(500).send({
        message: "Internal Server Error",
      });
    }
  };


  // const verifyToken = async (req, res, next) => {
  //   try {
  //     // Simulate unauthorized response for testing purposes
  //     return res.status(401).send({
  //       message: "Unauthorized! (Testing Purpose)",
  //     });
  //   } catch (error) {
  //     console.error("Error retrieving token from database:", error);
  //     return res.status(500).send({
  //       message: "Internal Server Error",
  //     });
  //   }
  // };


  // router.post("/cleardb", async (req, res) => {
  //   try {
  //     const collId = req.query.collId; 
  //     await Lenses.update({ Lens_Status: 'available' }, { where: { CollectionId: collId } });
  //     await SelectedReader.destroy({ where: { CollectionId: collId } });
  //     res.status(200).send({ message: "Lens_Status updated to 'available' successfully" });
  //   } catch (e) {
  //     console.error("Error updating Lens_Status:", e);
  //     res.status(500).send({ message: "Internal server error", error: e });
  //   }
  // });
  router.post("/cleardb", async (req, res) => {
    try {
      const collId = req.query.collId;
      await Lenses.update({ Lens_Status: 'reading' }, { where: { CollectionId: collId, lensId: { [Op.like]: 'ZZZ%' } } });
      await Lenses.update({ Lens_Status: 'available' }, { where: { CollectionId: collId, lensId: { [Op.notLike]: 'ZZZ%' } } });
      res.status(200).send({ message: "Lens_Status updated successfully" });
    } catch (e) {
      console.error("Error updating Lens_Status:", e);
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  // Sign in, Sign up, sign out
  router.post("/signUp", async (req, res) => {
    try {
      const userExist = await User.findOne({
        where: { email: req.body.email },
      });
      if (userExist) res.status(400).send({ message: "email already exists" });
      req.body.password = bcrypt.hashSync(req.body.password, 8);
      let data = req.body;
      data = {
        ...data,
        role: "2",
      };
      await User.create(data);
      res.status(200).send({ message: "User created successfully" });
    } catch (e) {
      // it will handle all the exceptions like Database error (example I have required all the fields in user table, so it will through the required field validation)
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  router.post("/signIn", async (req, res) => {
    try {
      const user = await User.findOne({ where: { email: req.body.email } });
      console.log("user", user);
      if (!user) {
        return res.status(404).send({ message: "User has not registered yet" });
      }

      const passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({ message: "Invalid Password!" });
      }
      const token = generateToken(user.email);
      const existingSession = await UserLoginSession.findOne({
        where: { UserId: user.id },
      });
      console.log("existingSession", existingSession);

      if (existingSession) {
        // Update existing session
        await existingSession.update({ token: token });
      } else {
        // Create new session
        console.log("user.id", user.id);
        console.log("token", token);
        await UserLoginSession.create({ UserId: user.id, token: token });
      }
      let collIds = [];
      if (user.role !== 1) {
        const userCollections = await UserCollection.findAll({
          where: { userId: user.id },
          attributes: ["Coll_id"],
        });

        collIds = userCollections.map((item) => item.Coll_id);
      }
      return res.status(200).send({
        token: token,
        firstName: user.firstName,
        userId: user.id,
        role: user.role,
        collIds: collIds || null,
      });
    } catch (e) {
      console.log("Error:", e);
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  // Helper function to generate a new JWT token
  const generateToken = (userId) => {
    return jwt.sign({ id: userId }, "SecretKeyForEyeGlasses", {
      expiresIn: 86400, // 24 hours
    });
  };

  router.get("/users", async (req, res) => {
    try {
      const userId = req.query.userId;
      if (!userId) {
        return res.status(404).send({ message: "User Id is not available" });
      }
      const user = await User.findOne({ where: { id: userId } });
      console.log("user", user);
      if (!user) {
        return res.status(404).send({ message: "User has not registered yet" });
      }

      if (user.role != "1") {
        return res
          .status(500)
          .send({ message: "User is not allowed to get these details" });
      }

      // const users = await User.findAll();
      // const users = await User.findAll();
      const users = await User.findAll({
        include: [{
          model: Collection,
          through: {
            attributes: []
          }
        }]
      });

      if (!users)
        res.status(500).send({ message: "Internal server data" });

      return res.status(200).send({
        message: "Users data",
        Users: users,
      });
    } catch (e) {
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  router.post("/create-users", verifyToken, async (req, res) => {
    try {
      const userExist = await User.findOne({
        where: { email: req.body.email },
      });
      if (userExist) res.status(400).send({ message: "Email already exists" });
      req.body.password = bcrypt.hashSync(req.body.password, 8);
      let data = req.body;
      const Coll_id = req.body.Coll_Id || [];
      data = {
        ...data,
        role: "2",
      };
      const userColl = await User.create(data);

      for (const collId of Coll_id) {
        await UserCollection.create({
          userId: userColl.id,
          Coll_Id: collId,
        });
      }

      res.status(200).send({ message: "User created successfully" });
    } catch (e) {
      // it will handle all the exceptions like Database error (example I have required all the fields in user table, so it will through the required field validation)
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  // router.put("/update-user", verifyToken, async (req, res) => {
  //   try {
  //     const id = req.body.id
  //     if(!id){
  //       res.status(400).send({ message: "User id is not available" });
  //     }
  //     const userExist = await User.findOne({
  //       where: { id: req.body.id },
  //     });
  //     if (!userExist) res.status(400).send({ message: "User not found" });
  //     if (userExist.password == req.body.password) {
  //       delete req.body.password;
  //     } else {
  //       req.body.password = bcrypt.hashSync(req.body.password, 8);
  //     }
  //     await User.update(req.body,{
  //       where : {
  //         id : req.body.id
  //       }
  //     });
  //     res.status(200).send({ message: "User created successfully" });
  //   } catch (e) {
  //     // it will handle all the exceptions like Database error (example I have required all the fields in user table, so it will through the required field validation)
  //     res.status(500).send({ message: "Internal server error", error: e });
  //   }
  // });

  router.put("/update-user", verifyToken, async (req, res) => {
    try {
      const id = req.body.id;
      if (!id) {
        res.status(400).send({ message: "User id is not available" });
      }
      const userExist = await User.findOne({
        where: { id: id },
      });
      if (!userExist) res.status(400).send({ message: "User not found" });

      // Update user password if it has changed
      if (userExist.password !== req.body.password) {
        req.body.password = bcrypt.hashSync(req.body.password, 8);
      } else {
        delete req.body.password; // If password remains the same, remove from update data
      }

      await User.update(req.body, {
        where: { id: id }
      });

      // Update user collection
      const Coll_id = req.body.Coll_id || [];
      if (req.body.Coll_id) {
        await UserCollection.destroy({
          where: { userId: id }
        });
        for (const collId of Coll_id) {
          await UserCollection.create({
            userId: id,
            Coll_Id: collId
          });
        }
      }
      res.status(200).send({ message: "User updated successfully" });
    } catch (e) {
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  router.delete("/delete-users", verifyToken, async (req, res) => {
    try {
      const id = req.body.id
      if (!id) {
        res.status(500).send({ message: "Id is not available" });
      }
      const userExist = await User.findOne({
        where: { id: id },
      });
      if (!userExist) {
        res.status(500).send({ message: "User is not available" });
      }
      const UserCollectionExist = await UserCollection.findOne({
        where: { UserId: id },
      });
      if (UserCollectionExist) {
        await UserCollection.destroy({
          where: { userId: id },
        });
      }

      const UserLoginSessionExist = await UserLoginSession.findOne({
        where: { userId: id },
      });
      if (UserLoginSessionExist)
        await UserLoginSession.destroy({
          where: { UserId: id },
        });

      await User.destroy({
        where: { id: id },
      });

      res.status(200).send({ message: "User deleted successfully" });
    } catch (e) {
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  router.post("/signOut", async (req, res) => {
    try {
      await UserLoginSession.destroy({
        where: { token: req.headers.authorization },
      });
      return res.status(200).send({
        message: "User signout successfully",
      });
    } catch (e) {
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  // collection CRUD operation
  router.post("/collection", verifyToken, async (req, res) => {
    try {
      const data = {
        ...req.body,
        UserId: req.query.userId,
      };
      const collectionData = await Collection.create(data);
      if (!collectionData)
        res.status(500).send({ message: "Internal server data" });
      return res.status(200).send({
        message: "Collection created successfully",
        Collection_Data: collectionData,
      });
    } catch (e) {
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  router.get("/collection", verifyToken, async (req, res) => {
    try {
      const whereClause = {
        // UserId: req.query.userId,
      };

      if (req.query.colId) {
        whereClause.Coll_id = { [Sequelize.Op.like]: `%${req.query.colId}%` };
      }

      const collectionData = await Collection.findAll({
        where: whereClause,
      });
      if (!collectionData)
        res.status(500).send({ message: "Internal server data" });
      return res.status(200).send({
        message: "Collection data",
        Collection_Data: collectionData.sort((a, b) => new Date(b.Coll_date) - new Date(a.Coll_date)),
      });
    } catch (e) {
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  router.post("/getCollectionsByIds", verifyToken, async (req, res) => {
    try {
      const { collectionIds } = req.body;

      if (!collectionIds || !Array.isArray(collectionIds) || collectionIds.length === 0) {
        return res.status(400).send({ message: "Invalid or empty collection IDs provided." });
      }

      const whereClause = {
        id: {
          [Sequelize.Op.in]: collectionIds,
        },
      };

      // Filter based on req.query.colId if present
      if (req.query.colId) {
        whereClause.Coll_id = { [Sequelize.Op.like]: `%${req.query.colId}%` };
      }

      const collectionData = await Collection.findAll({
        where: whereClause,
      });

      // if (!collectionData || collectionData.length === 0) {
      //   return res.status(404).send({ message: "Collections not found for the provided IDs." });
      // }

      return res.status(200).send({
        message: "Collections data",
        Collection_Data: collectionData,
      });
    } catch (e) {
      console.error("Error:", e);
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  router.put("/collection", verifyToken, async (req, res) => {
    try {
      let id = req.query.id;

      console.log("data to update collection", req.body);
      //delete req.body.Coll_id;
      let collectionUpdated = await Collection.update(req.body, {
        where: { id: id },
      });
      if (!collectionUpdated)
        res.status(500).send({ message: "Internal server data" });
      collectionUpdated = await Collection.findOne({ id: id });
      return res.status(200).send({
        message: "Collection updated successfully",
        Collection_Date: collectionUpdated,
      });
    } catch (e) {
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  router.delete("/collection", verifyToken, async (req, res) => {
    try {
      await UserCollection.destroy({
        where: { Coll_Id: req.body.Coll_id },
      });
      await SelectedReader.destroy({ where: { CollectionId: req.body.Coll_id } });
      const patientDeleted = await Patient.destroy({
        where: { CollectionId: req.body.Coll_id },
      });
      const lensDeleted = await Lenses.destroy({
        where: { CollectionId: req.body.Coll_id },
      });
      const userExist = await SelectedReader.findOne({
        where: { CollectionId: req.body.Coll_id },
      });
    
      const collectionDeleted = await Collection.destroy({
        where: { id: req.body.Coll_id },
      });

      if (!collectionDeleted)
        res.status(500).send({ message: "Internal server data" });
      return res.status(200).send({
        message: "Collection deleted successfully",
      });
    } catch (e) {
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  // Boxes CRUD operation
  router.post("/box", verifyToken, async (req, res) => {
    try {
      const data = {
        ...req.body,
        UserId: req.query.userId,
      };
      const BoxData = await Boxes.create(data);
      if (!BoxData) res.status(500).send({ message: "Internal server data" });
      return res.status(200).send({
        message: "Box created successfully",
        Box_Data: BoxData,
      });
    } catch (e) {
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });
  router.get("/box", verifyToken, async (req, res) => {
    try {
      const whereClause = {
        // UserId: req.query.userId,
      };

      if (req.query.boxId) {
        whereClause.Box_id = { [Sequelize.Op.like]: `%${req.query.boxId}%` };
      }

      const BoxesData = await Boxes.findAll({
        where: whereClause,
      });
      if (!BoxesData) res.status(500).send({ message: "Internal server data" });
      return res.status(200).send({
        message: "Boxes data",
        Boxes_Data: BoxesData,
      });
    } catch (e) {
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  router.put("/box", verifyToken, async (req, res) => {
    try {
      let id = req.body.id;
      delete req.body.Box_id;
      let BoxUpdated = await Boxes.update(req.body, { where: { id: id } });

      console.log("box data for put api after BoxUpdated", BoxUpdated);
      if (!BoxUpdated)
        res.status(500).send({ message: "Internal server data" });
      BoxUpdated = await Boxes.findOne({ id: id });
      console.log("BoxUpdated222222222", BoxUpdated);
      return res.status(200).send({
        message: "Box updated successfully",
        Box_Date: BoxUpdated,
      });
    } catch (e) {
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  router.delete("/box", verifyToken, async (req, res) => {
    try {
      const boxDeleted = await Boxes.destroy({
        where: { id: req.body.Box_id },
      });
      if (!boxDeleted)
        res.status(500).send({ message: "Internal server data" });
      return res.status(200).send({
        message: "Box deleted successfully",
      });
    } catch (e) {
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  // Function to generate a unique alphanumeric string of 12 characters
  //   async function generateUniqueAlphanumericString() {
  //     let uniqueString;
  //     let existingRecord;
  //     const alphanumericChars =
  //       "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  //     do {
  //       // Generate a random string of length 12
  //       uniqueString = Array.from(
  //         { length: 12 },
  //         () =>
  //           alphanumericChars[
  //             Math.floor(Math.random() * alphanumericChars.length)
  //           ]
  //       ).join("");

  //       // Check if the generated string already exists in the database
  //       existingRecord = await Lenses.findOne({
  //         where: {
  //           lensId: uniqueString,
  //         },
  //       });

  //       // If the string exists, generate a new one
  //     } while (existingRecord);

  //     return uniqueString;
  //   }

  // Lenses CRUD operation
  router.post("/lens", verifyToken, async (req, res) => {
    try {
      // const { lensId } = req.body;
      const { lensId, CollectionId } = req.body;

      // Check if a lens with the provided lensId and collId already exists
      const existingLens = await Lenses.findOne({ where: { lensId, CollectionId: CollectionId } });
  
      if (existingLens) {
        // Lens with the provided lensId and collId already exists
        return res.status(400).json({ message: "Lens with the provided lensId and collId already exists" });
      }

      if (existingLens) {
        // Lens with the provided lensId already exists
        return res.status(400).json({ message: "Lens with the provided lensId already exists" });
      }
      const data = {
        ...req.body,
        UserId: req.query.userId,
      };
      console.log("post lens data", data);
      const LensData = await Lenses.create(data);
      if (!LensData) res.status(500).send({ message: "Internal server data" });
      return res.status(200).send({
        message: "Box created successfully",
        Box_Data: LensData,
      });
      // });
    } catch (e) {
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });
  const upload = multer().single("csv");
  // const upload = multer().single("xlsx");

  // router.post("/lensCsv", verifyToken, upload, async (req, res) => {
  //   const collId = req.query.collid;
  //   try {
  //     if (!req.file) {
  //       return res.status(400).json({ error: "CSV file not provided." });
  //     }

  //     const excelFile = req.file;

  //     const workbook = xlsx.read(excelFile.buffer, { type: "buffer" });
  //     const sheetName = workbook.SheetNames[0];
  //     const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  //     const validLensStatus = ['selected', 'available', 'missing', 'reading', 'dispensed', 'trashed'];
  //     if (sheetData.some(row => !row.Lens_Status || !validLensStatus.includes(row.Lens_Status.toLowerCase()))) {
  //       return res.status(400).json({ error: "Please select a correct Lens_Status for all records." ,status:false});
  //     }

  //     const lensData = [];
  //     const todayDate = moment().tz('America/New_York').startOf('day').toISOString();
  //     for (const row of sheetData) {
  //       const lensEntry = {
  //         lensId: row.Lens_ID || row.lensId,
  //         // Lens_Status: 'available' || null,
  //         Lens_Status: row.Lens_Status || row.Lens_Status,
  //         Lens_Gender: row.Lens_Gender || null,
  //         RSphere: row.RSphere !== undefined ? row.RSphere.toString() : null,
  //         RCylinder: row.RCylinder !== undefined ? row.RCylinder.toString() : null,
  //         RAxis: row.RAxis !== undefined ? row.RAxis.toString() : null,
  //         RAdd: row.RAdd !== undefined ? row.RAdd.toString() : null,
  //         LSphere: row.LSphere !== undefined ? row.LSphere.toString() : null,
  //         LCylinder: row.LCylinder !== undefined ? row.LCylinder.toString() : null,
  //         LAxis: row.LAxis !== undefined ? row.LAxis.toString() : null,
  //         LAdd: row.LAdd !== undefined ? row.LAdd.toString() : null,
  //         CollectionId: collId || null,
  //         createdAt: todayDate,
  //         updatedAt: todayDate
  //       };

  //       // Check if Lens_ID already exists in the database
  //       // const existingLens = await Lenses.findOne({
  //       //   where: { CollectionId: collId }
  //       // });
  //       const existingLens = await Lenses.findOne({
  //         where: { lensId: row.Lens_ID }
  //       });

  //       if (!existingLens) {
  //         lensData.push(lensEntry);
  //       }
  //     }

  //     try {
  //       if (lensData.length > 0) {
  //         const createdLenses = await Lenses.bulkCreate(lensData);
  //         return res.status(200).send({
  //           message: "Lenses created successfully",
  //           Lens_Data: createdLenses
  //         });
  //       } else {
  //         return res.status(200).send({
  //           message: "No new lenses added from the CSV file"
  //         });
  //       }
  //     } catch (e) {
  //       res.status(500).send({ message: "Error creating lenses", error: e });
  //     }
  //   } catch (e) {
  //     res.status(500).send({ message: "Internal server error", error: e });
  //   }
  // });

  // router.post("/lensCsv", verifyToken, upload, async (req, res) => {
  //   const collId = req.query.collid;
  //   try {
  //     if (!req.file) {
  //       return res.status(400).json({ error: "CSV file not provided." });
  //     }

  //     const excelFile = req.file;

  //     const workbook = xlsx.read(excelFile.buffer, { type: "buffer" });
  //     const sheetName = workbook.SheetNames[0];
  //     const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  //     const validLensStatus = ['selected', 'available', 'missing', 'reading', 'dispensed', 'trashed'];
  //     if (sheetData.some(row => !row.Lens_Status || !validLensStatus.includes(row.Lens_Status.toLowerCase()))) {
  //       return res.status(400).json({ error: "Please select a correct Lens_Status for all records.", status: false });
  //     }

  //     const lensData = [];
  //     const todayDate = moment().tz('America/New_York').startOf('day').toISOString();

  //     // Check if any duplicate Lens_ID or lensId exists for the provided CollectionId
  //     const existingLensIds = await Lenses.findAll({
  //       attributes: ['lensId'],
  //       where: { CollectionId: collId }
  //     });
  //     const existingLensIdSet = new Set(existingLensIds.map(lens => lens.lensId));

  //     for (const row of sheetData) {
  //       if (existingLensIdSet.has(row.Lens_ID || row.lensId)) {
  //         return res.status(400).json({ error: `Lens with ID  ${row.Lens_ID || row.lensId} already exists for the provided CollectionId. Please ensure Lens IDs are unique.`, status: false });
  //       }

  //       const lensEntry = {
  //         lensId: row.Lens_ID || row.lensId,
  //         Lens_Status: row.Lens_Status || row.Lens_Status,
  //         Lens_Gender: row.Lens_Gender || null,
  //         RSphere: row.RSphere !== undefined ? row.RSphere.toString() : null,
  //         RCylinder: row.RCylinder !== undefined ? row.RCylinder.toString() : null,
  //         RAxis: row.RAxis !== undefined ? row.RAxis.toString() : null,
  //         RAdd: row.RAdd !== undefined ? row.RAdd.toString() : null,
  //         LSphere: row.LSphere !== undefined ? row.LSphere.toString() : null,
  //         LCylinder: row.LCylinder !== undefined ? row.LCylinder.toString() : null,
  //         LAxis: row.LAxis !== undefined ? row.LAxis.toString() : null,
  //         LAdd: row.LAdd !== undefined ? row.LAdd.toString() : null,
  //         CollectionId: collId || null,
  //         createdAt: todayDate,
  //         updatedAt: todayDate
  //       };


  //       lensData.push(lensEntry);
  //     }

  //     try {
  //       if (lensData.length > 0) {
  //         const createdLenses = await Lenses.bulkCreate(lensData);
  //         return res.status(200).send({
  //           message: "Lenses created successfully",
  //           status:true,
  //           Lens_Data: createdLenses
  //         });
  //       } else {
  //         return res.status(200).send({
  //           message: "No new lenses added from the CSV file",status:true
  //         });
  //       }
  //     } catch (e) {
  //       res.status(500).send({ message: "Error creating lenses", error: e,status:false });
  //     }
  //   } catch (e) {
  //     res.status(500).send({ message: "Internal server error", error: e ,status:false});
  //   }
  // });
  router.post("/lensCsv", verifyToken, upload, async (req, res) => {
    const collId = req.query.collid;
    try {
      if (!req.file) {
        return res.status(400).json({ error: "CSV file not provided." });
      }

      const excelFile = req.file;

      const workbook = xlsx.read(excelFile.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      const validLensStatus = ['selected', 'available', 'missing', 'reading', 'dispensed', 'trashed'];
      if (sheetData.some(row => !row.Lens_Status || !validLensStatus.includes(row.Lens_Status.trim().toLowerCase()))) {
        return res.status(400).json({ error: "Please select a correct Lens_Status for all records.", status: false });
      }

      const lensData = [];
      const duplicateLenses = [];
      const todayDate = moment().tz('America/New_York').startOf('day').toISOString();

      // Check existing lens IDs
      const existingLensIds = await Lenses.findAll({
        attributes: ['lensId'],
        where: { CollectionId: collId }
      });
      const existingLensIdSet = new Set(existingLensIds.map(lens => lens.lensId));

      // Track lens IDs in current import to catch duplicates within the CSV
      const importedLensIds = new Set();

      for (const row of sheetData) {
        const currentLensId = row.Lens_ID || row.lensId;

        // Check if lens ID already exists in database or current import
        if (existingLensIdSet.has(currentLensId) || importedLensIds.has(currentLensId)) {
          duplicateLenses.push(currentLensId);
          continue; // Skip this lens but continue processing others
        }

        importedLensIds.add(currentLensId);

        const lensEntry = {
          lensId: currentLensId,
          Lens_Status: row.Lens_Status || row.Lens_Status,
          Lens_Gender: row.Lens_Gender || null,
          RSphere: row.RSphere !== undefined ? row.RSphere.toString() : null,
          RCylinder: row.RCylinder !== undefined ? row.RCylinder.toString() : null,
          RAxis: row.RAxis !== undefined ? row.RAxis.toString() : null,
          RAdd: row.RAdd !== undefined ? row.RAdd.toString() : null,
          LSphere: row.LSphere !== undefined ? row.LSphere.toString() : null,
          LCylinder: row.LCylinder !== undefined ? row.LCylinder.toString() : null,
          LAxis: row.LAxis !== undefined ? row.LAxis.toString() : null,
          LAdd: row.LAdd !== undefined ? row.LAdd.toString() : null,
          CollectionId: collId || null,
          createdAt: todayDate,
          updatedAt: todayDate
        };

        lensData.push(lensEntry);
      }

      try {
        if (lensData.length > 0) {
          const createdLenses = await Lenses.bulkCreate(lensData);
          const response = {
            message: "Lenses created successfully",
            status: true,
            Lens_Data: createdLenses,
          };

          // Add warning message if there were duplicates
          if (duplicateLenses.length > 0) {
            response.warnings = {
              message: "Some duplicate lens IDs were skipped",
              skippedLenses: duplicateLenses
            };
          }

          return res.status(200).send(response);
        } else {
          return res.status(500).send({
            error: "No new lenses added from the CSV file",
            status: false,
            warnings: duplicateLenses.length > 0 ? {
              message: "All lens IDs were duplicates",
              skippedLenses: duplicateLenses
            } : undefined
          });
        }
      } catch (e) {
        res.status(500).send({ message: "Error creating lenses", error: e, status: false });
      }
    } catch (e) {
      res.status(500).send({ message: "Internal server error", error: e, status: false });
    }
  });

  router.get("/lens", verifyToken, async (req, res) => {
    try {
      const {
        Patient_id,
        RSphere,
        RCylinder,
        RAxis,
        RAdd,
        LSphere,
        LCylinder,
        LAxis,
        LAdd,
        lensId,
      } = req.query;
      let filter = {};
      const userId = req.query.userId;
      if (Patient_id) {
        if (req.query.match === "true") {
          filter = {
            ...(RSphere && { RSphere }),
            ...(RCylinder && { RCylinder }),
            ...(RAxis && { RAxis }),
            ...(RAdd && { RAdd }),
            ...(LSphere && { LSphere }),
            ...(LCylinder && { LCylinder }),
            ...(LAxis && { LAxis }),
            ...(LAdd && { LAdd }),
            ...(lensId && { lensId }),
            // userId,
          };
        } else {
          filter = {
            ...(Patient_id && { Patient_id }),
            ...(lensId && { lensId }),
            // userId,
          };
        }
      } else {
        filter = {
          //...(Patient_id && { Patient_id }),
          ...(RSphere && { RSphere }),
          ...(RCylinder && { RCylinder }),
          ...(RAxis && { RAxis }),
          ...(RAdd && { RAdd }),
          ...(LSphere && { LSphere }),
          ...(LCylinder && { LCylinder }),
          ...(LAxis && { LAxis }),
          ...(LAdd && { LAdd }),
          ...(lensId && { lensId }),
          // userId,
        };
      }

      const whereCondition =
        Object.keys(filter).length > 0
          ? {
            [Op.and]: Object.keys(filter).map((key) => ({
              [key]: filter[key],
            })),
            //[Op.and]: [{userId : userId}]
          }
          : {};

      const Lensesdata = await Lenses.findAll({
        where: whereCondition,
        include: [{ model: Collection, attributes: ['Coll_name'] }],
      });


      if (!Lensesdata) {
        return res.status(500).send({ message: "Internal server data" });
      }
      return res.status(200).send({
        message: "Lens data",
        Lenses_Data: Lensesdata,
      });
    } catch (e) {
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  router.get('/lensesByCollectionId', async (req, res) => {
    try {
      const { collectionId } = req.query;

      // Check if collectionId is provided
      if (!collectionId) {
        return res.status(400).json({ message: 'CollectionId is required in query parameters.' });
      }

      // Query lenses based on the provided collectionId
      const lensesData = await Lenses.findAll({
        where: {
          CollectionId: collectionId
        }
      });

      // Return the lens data as JSON response
      res.status(200).json({ message: 'Lens data found', lensesData: lensesData });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Internal server error', error: error });
    }
  });

  // router.post("/getLensById", verifyToken, async (req, res) => {
  //   try {
  //     const { lensId } = req.query;
  //     const { collectionIds } = req.body;
  //     if (!lensId) {
  //       return res.status(400).send({ message: "Lens ID is required in the query parameters." });
  //     }
  //     // const whereClause = {
  //     //   CollectionId: {
  //     //     [Sequelize.Op.in]: collectionIds, lensId: lensId,
  //     //   },
  //     // };

  //     // // Filter based on req.query.lensId if present
  //     // if (lensId) {
  //     //   whereClause.lensId = lensId;
  //     // }

  //     // const lensData = await Lenses.findAll({
  //     //   where: whereClause,
  //     // });
  //     const whereClause = {
  //       lensId: lensId,
  //       CollectionId: collectionIds
  //     };
  
  //     // Retrieve lens data based on the where clause
  //     const lensData = await Lenses.findAll({
  //       where: whereClause
  //     });

  //     return res.status(200).send({
  //       message: "Lens data",
  //       Lenses_Data: lensData,
  //     });
  //   } catch (e) {
  //     console.error("Error:", e);
  //     res.status(500).send({ message: "Internal server error", error: e });
  //   }
  // });
  router.post("/getLensById", verifyToken, async (req, res) => {
    try {
      let { lensId } = req.query;
      const { collectionIds } = req.body;
      if (lensId === null || lensId === undefined || lensId === "") {
        lensId = null;
      }

      const whereClause = {
        lensId: lensId,
        CollectionId: collectionIds
      };

      if (lensId === null) {
        delete whereClause.lensId;
      }

      // Retrieve lens data based on the where clause
      const lensData = await Lenses.findAll({
        where: whereClause
      });
      // const whereClause = {
      //   lensId: lensId,
      //   CollectionId: collectionIds
      // };
  
      // // Retrieve lens data based on the where clause
      // const lensData = await Lenses.findAll({
      //   where: whereClause
      // });

      return res.status(200).send({
        message: "Lens data",
        Lenses_Data: lensData,
      });
    } catch (e) {
      console.error("Error:", e);
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  router.put("/lens", verifyToken, async (req, res) => {
    try {
      let id = req.body.id;
      delete req.body.lensId;
      let LensUpdated = await Lenses.update(req.body, { where: { id: id } });
      if (!LensUpdated)
        res.status(500).send({ message: "Internal server data" });
      LensUpdated = await Lenses.findOne({ id: id });
      return res.status(200).send({
        message: "Lens updated successfully",
        Lens_Date: LensUpdated,
      });
    } catch (e) {
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  router.delete("/lens", verifyToken, async (req, res) => {
    try {
      const lensDeleted = await Lenses.destroy({
        where: { id: req.body.Lens_id },
      });
      if (!lensDeleted)
        res.status(500).send({ message: "Internal server data" });
      return res.status(200).send({
        message: "Lens deleted successfully",
      });
    } catch (e) {
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  // Patient CRUD operation
  router.post("/patient", verifyToken, async (req, res) => {
    try {
      const data = {
        ...req.body,
        UserId: req.query.userId,
      };

      console.log("data for patient", data);
      // generateUniqueAlphanumericStringForPatient().then(async (uniqueString) => {
      // data.PatientId = uniqueString;
      const patientData = await Patient.create(data);
      console.log("data for patient222222222222", patientData);
      if (!patientData)
        res.status(500).send({ message: "Internal server data" });
      return res.status(200).send({
        message: "Patient created successfully",
        Patient_Data: patientData,
      });
      // });
    } catch (e) {
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });
  router.get("/patient", verifyToken, async (req, res) => {
    try {
      const patientData = await Patient.findAll();
      // const patientData = await Patient.findAll({
      //   where: { UserId: req.query.userId },
      // });
      if (!patientData)
        res.status(500).send({ message: "Internal server data" });
      return res.status(200).send({
        message: "Patient data",
        Patient_Data: patientData,
      });
    } catch (e) {
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  router.get("/patientById", async (req, res) => {
    const patientId = req.query.id;
    try {
      const patientData = await Patient.findOne({ where: { PatientId: patientId } });
      if (!patientData)
        return res.status(404).send({ message: "Patient not found" });
      return res.status(200).send({
        message: "Patient data",
        Patient_Data: patientData,
      });
    } catch (error) {
      console.error("Error fetching patient data:", error);
      res.status(500).send({ message: "Internal server error", error: error.message });
    }
  });


  router.get("/filterpatientById", verifyToken, async (req, res) => {
    try {
      const searchString = req.query.id;
      console.log("searchString", searchString);
      if (searchString === "") {
        return res.status(200).send({
          message: "Filtered patient data",
          Patient_Data: [],
        });
      }
      const patientData = await Patient.findAll({
        where: {
          PatientId: {
            [Op.like]: `${searchString}`,
          },
        },
        // Add a case-insensitive collation for SQL Server
        collate: {
          collation: "SQL_Latin1_General_CP1_CI_AS",
        },
      });

      console.log("patientData", patientData);
      if (!patientData) {
        return res.status(500).send({ message: "Internal server data" });
      }
      console.log("patientData", patientData);
      return res.status(200).send({
        message: "Filtered patient data",
        Patient_Data: patientData,
      });
    } catch (e) {
      console.log("error in filter", e);
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  router.get("/patientByName", verifyToken, async (req, res) => {
    try {
      const name = req.query.name.trim();
      const patientData = await Patient.findAll();
      const data = patientData.filter((value) => {
        const fullName = value.firstName + value.lastName;
        return fullName.includes(name);
      });
      if (!data) res.status(500).send({ message: "Internal server data" });
      return res.status(200).send({
        message: "Patient data",
        Patient_Data: data,
      });
    } catch (e) {
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  router.put("/patient", verifyToken, async (req, res) => {
    try {
      let id = req.query.id;
      //delete req.body.Patient_id;
      let patientUpdated = await Patient.update(req.body, {
        where: { id: id },
      });
      if (!patientUpdated) {
        res.status(500).send({ message: "Internal server data" });
      }
      patientUpdated = await Patient.findOne({ id: id });
      return res.status(200).send({
        message: "Patient updated successfully",
        Patient_Date: patientUpdated,
      });
    } catch (e) {
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  router.delete("/patient", verifyToken, async (req, res) => {
    try {
      const patientDeleted = await Patient.destroy({
        where: { id: req.body.id },
      });
      if (!patientDeleted)
        res.status(500).send({ message: "Internal server data" });
      return res.status(200).send({
        message: "Patient deleted successfully",
      });
    } catch (e) {
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  router.put("/block", verifyToken, async (req, res) => {
    try {
      let lensUpdated = await Lenses.update(
        { Patient_id: req.body.patient_id, Is_Blocked: true },
        { where: { id: req.body.lens_id } }
      );
      if (!lensUpdated)
        res.status(500).send({ message: "Internal server data" });
      lensUpdated = await Lenses.findOne({ id: req.body.lens_id });
      return res.status(200).send({
        message: "Lens blocked successfully",
        Lens_Date: lensUpdated,
      });
    } catch (e) {
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  router.get("/algoData", verifyToken, async (req, res) => {
    try {
      console.log("algoData........", AlgoData);
      const algoData = await AlgoData.findAll();
      console.log("algoData>>>>>>>>", algoData);
      if (!algoData) res.status(500).send({ message: "Internal server data" });
      return res.status(200).send({
        message: "AlgoData",
        algoData: algoData,
      });
    } catch (e) {
      console.log("error/////////", e);
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  router.get("/config", verifyToken, async (req, res) => {
    try {
      const userId = req.query.userId;
      if (!userId) {
        return res.status(404).send({ message: "User Id is not available" });
      }
      const user = await User.findOne({ where: { id: userId } });
      console.log("user", user);
      if (!user) {
        return res.status(404).send({ message: "User has not registered yet" });
      }

      if (user.role != "1") {
        return res
          .status(500)
          .send({ message: "User is not allowed to get these details" });
      }

      const eyeWearConfig = await EyeWearConfig.findAll();
      const axisConfig = await AxisConfig.findAll();

      // Check if the arrays are empty
      if (!eyeWearConfig.length || !axisConfig.length) {
        return res.status(500).send({ message: "Internal server data" });
      }


      const sortArray = (array) => {
        return array.sort((a, b) => {
          const paramA = a.Parameters.toUpperCase();
          const paramB = b.Parameters.toUpperCase();
          return paramA.localeCompare(paramB);
        });
      };
      const sortedEyeWearConfig = sortArray(eyeWearConfig);


      return res.status(200).send({
        message: "Configuration data",
        axisConfig: axisConfig,
        eyeWearConfig: sortedEyeWearConfig,
      });
    } catch (e) {
      console.error("Error:", e);
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  router.put("/update-eyewear-config", verifyToken, async (req, res) => {
    try {
      const data = req.body;
      if (!data || data.length === 0) {
        return res.status(404).send({ message: "No data to update" });
      }

      const updatePromises = data.map(async (item) => {
        try {
          const [updated] = await EyeWearConfig.update(item, {
            where: { Id: item.Id },
          });

        } catch (error) {
          console.error("Error updating row:", error);
          throw error;
        }
      });

      await Promise.all(updatePromises);
      // Check if the arrays are empty

      return res.status(200).send({
        message: "Configuration data updated successfully",
      });
    } catch (e) {
      console.error("Error:", e);
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  router.put("/update-axis-config", verifyToken, async (req, res) => {
    try {
      const data = req.body;
      if (!data || data.length === 0) {
        return res.status(404).send({ message: "No data to update" });
      }
      // Assuming 'Id' is the primary key
      const updatePromises = data.map(async (item) => {
        try {
          const [updated] = await AxisConfig.update(item, {
            where: { Id: item.Id },
          });

        } catch (error) {
          console.error("Error updating row:", error);
          throw error;
        }
      });

      await Promise.all(updatePromises);
      // Check if the arrays are empty

      return res.status(200).send({
        message: "Configuration data updated successfully",
      });
    } catch (e) {
      console.error("Error:", e);
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  router.post("/selectedReader", verifyToken, async (req, res) => {
    try {
      const data = {
        ...req.body,
      };

      const existingRecord = await SelectedReader.findOne({
        where: {
          lensId: data.lensId,
          Patient_id: data.Patient_id
        }
      });

      // if (existingRecord) {
      //   return res.status(400).send({ message: "Record with the same lensId and PatientId already exists" });
      // }
      if (existingRecord) {
        // Update the existing record instead of creating a new one
        await SelectedReader.update(data, {
          where: {
            lensId: data.lensId,
          }
        });
        return res.status(200).send({ message: "Record updated successfully" });
      }
      let LensUpdated = await Lenses.update(req.body, { where: { lensId: data.lensId,CollectionId:data.CollectionId } });
      const readerData = await SelectedReader.create(data);
      if (!readerData)
        res.status(500).send({ message: "Internal server data" });
      return res.status(200).send({
        message: "selectedReader created successfully",
        readerData: readerData,
      });
      // });
    } catch (e) {
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });

  router.get("/selectedReaderFilter", verifyToken, async (req, res) => {
    try {
      const Patient_id = req.query.patientId;
      const readers = await SelectedReader.findAll({
        where: { Patient_id: Patient_id },
      });
      if (readers.length > 0) {
        const lensIds = readers.map((reader) => reader.dataValues.lensId);
        const readersLens = await Lenses.findAll({
          where: { lensId: lensIds },
        });

        return res.status(200).send({
          message: "Readers fetched successfully",
          readers: readersLens,
        });
      }
      return res.status(200).send({
        message: "Readers fetched successfully",
        readers: [],
      });


    } catch (e) {
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });


  router.delete("/deleteSelectedReader", verifyToken, async (req, res) => {
    try {
      const patientId = req.body.patientId;
      const lensId = req.body.lensId;
      if (!patientId) {
        res.status(500).send({ message: "Id is not available" });
      }

      const userExist = await SelectedReader.findOne({
        where: {
          Patient_id: patientId,
          lensId: lensId
        },
      });
      if (!userExist) {
        res.status(500).send({ message: "User is not available" });
      }

      await SelectedReader.destroy({
        where: { Patient_id: patientId, lensId: lensId },
      });
      res.status(200).send({ message: "User deleted successfully" });
    } catch (e) {
      // it will handle all the exceptions like Database error (example I have required all the fields in user table, so it will through the required field validation)
      res.status(500).send({ message: "Internal server error", error: e });
    }
  });
  app.use("/api/v1", router);
};
