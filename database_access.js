module.exports = (app) => {
  const db = require("./connect");
  const User = db.User;
  const UserLoginSession = db.Session;
  const Sequelize = require("sequelize");
  const { Op } = require("sequelize");
  const Collection = db.Collection;
  const Boxes = db.Boxes;
  const Lenses = db.Lenses;
  const Patient = db.Patient;
  const AlgoData = db.AlgoData;

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

  const upload = multer().single("csv");

  // this method will be validating jwt token that we will create at the time of login
  // after login in every api we need to send the generated token in Authorization header key even while signOut
  const verifyToken = async (req, res, next) => {
    let tokenData;
    try {
      tokenData = await UserLoginSession.findOne({
        token: req.headers.authorization,
      });
    } catch (error) {
      console.error("Error retrieving token from database:", error);
      return res.status(500).send({
        message: "Internal Server Error",
      });
    }

    if (!tokenData) {
      return res.status(403).send({
        message: "No token provided!",
      });
    }
    jwt.verify(tokenData.token, "SecretKeyForEyeGlasses", (err, decoded) => {
      if (err) {
        return res.status(401).send({
          message: "Unauthorized!",
        });
      }
      req.email = decoded.id;
      next();
    });
  };

  // Sign in, Sign up, sign out
  router.post("/signUp", async (req, res) => {
    try {
      const userExist = await User.findOne({
        where: { email: req.body.email },
      });
      if (userExist) res.status(400).send({ message: "email already exists" });
      req.body.password = bcrypt.hashSync(req.body.password, 8);
      await User.create(req.body);
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
        await UserLoginSession.create({ UserId: user.id, token: token });
      }

      return res.status(200).send({
        token: token,
        firstName: user.firstName,
        userId: user.id,
        role : user.role
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
        UserId: req.query.userId,
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
        Collection_Data: collectionData,
      });
    } catch (e) {
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
        UserId: req.query.userId,
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
      console.log("box data for put api", req.body);
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
      const data = {
        ...req.body,
        UserId: req.query.userId,
      };
      // generateUniqueAlphanumericString().then(async (uniqueString) => {
      //     console.log('Generated unique string:', uniqueString);
      //     data.lensId = uniqueString;
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
  //create lens using csv file
  router.post("/lensCsv", verifyToken, upload, async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "CSV file not provided." });
      }

      const excelFile = req.file;

      const workbook = xlsx.read(excelFile.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      const lensData = sheetData.map((row) => {
        const lensEntry = {
          Lens_ID: row.Lens_ID || "",
          Lens_Status: row.Lens_Status || "",
          Lens_Gender: row.Lens_Gender || "",
          RSphere: row.RSphere !== undefined ? row.RSphere.toString() : "",
          RCylinder:
            row.RCylinder !== undefined ? row.RCylinder.toString() : "",
          RAxis: row.RAxis !== undefined ? row.RAxis.toString() : "",
          RAdd: row.RAdd !== undefined ? row.RAdd.toString() : "",
          LSphere: row.LSphere !== undefined ? row.LSphere.toString() : "",
          LCylinder:
            row.LCylinder !== undefined ? row.LCylinder.toString() : "",
          LAxis: row.LAxis !== undefined ? row.LAxis.toString() : "",
          LAdd: row.LAdd !== undefined ? row.LAdd.toString() : "",
          UserId: req.query.userId,
          Is_Blocked: false,
          Is_Booked: false,
        };
        return lensEntry;
      });

      try {
        const createdLenses = await Lenses.bulkCreate(lensData);
        // const createdLenses = await Lenses.create(lensData);
        if (!createdLenses) {
          return res.status(500).send({ message: "Error creating lenses" });
        }

        return res.status(200).send({
          message: "Lenses created successfully",
          Lens_Data: createdLenses,
        });
      } catch (e) {
        res.status(500).send({ message: "Internal server error", error: e });
      }
    } catch (e) {
      res.status(500).send({ message: "Internal server error", error: e });
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
        lensId
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
            userId,
          };
        } else {
          filter = {
            ...(Patient_id && { Patient_id }),
            ...(lensId && { lensId }),
            userId,
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
          userId,
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

  router.put("/lens", verifyToken, async (req, res) => {
    try {
      let id = req.body.Lens_id;
      delete req.body.Lens_id;
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
      const patientData = await Patient.findAll({
        where: { UserId: req.query.userId },
      });
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

  router.get("/patientById", verifyToken, async (req, res) => {
    try {
      const patientData = await Patient.findOne({
        where: { id: req.query.id },
      });
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
            [Op.like]: `%${searchString}%`,
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
      if (!patientUpdated)
        res.status(500).send({ message: "Internal server data" });
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

  app.use("/api/v1", router);
};
