const express = require("express");
const cors = require("cors");
const mongodb = require("mongodb");
const { json } = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const mongoClient = mongodb.MongoClient;
const app = express();
const URL =
  "mongodb+srv://kat369:Kathiravan1995@project-m-tool.xjuxrpd.mongodb.net/";
const DB = "infodazz";

app.use(express.static("public")); //updated line 
app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const path = `public/uploads/${req.query.volume}/${req.query.issue}`;

    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }
    cb(null, path);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

app.get("/file", async (req, res, next) => {
  console.log(req.query.id);
  try {
    const connection = await mongoClient.connect(URL);

    const db = connection.db(DB);

    const data = await db
      .collection("articles")
      .findOne({ _id: new mongodb.ObjectId(req.query.id) });

    await connection.close();

    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "try again later" });
  }
});

app.get("/allfile", async (req, res, next) => {
  try {
    const connection = await mongoClient.connect(URL);

    const db = connection.db(DB);

    let articles = await db.collection("articles").find().toArray();

    await connection.close();

    res.json(articles);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "try again later" });
  }
});

app.delete("/delfile", async (req, res, next) => {
  try {
    const connection = await mongoClient.connect(URL);

    const db = connection.db(DB);

    let articles = await db
      .collection("articles")
      .deleteOne({ _id: new mongodb.ObjectId("64621ebb8b05dd56e22c4f9f") });

    await connection.close();

    res.json({ message: "file deleted succesfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "try again later" });
  }
});

app.post("/create", upload.single("pdf"), async (req, res, next) => {
  const obj = JSON.parse(JSON.stringify(req.body));

  try {
    const connection = await mongoClient.connect(URL);

    const db = connection.db(DB);

    const data = await db.collection("articles").insertOne(obj);
    const mongoid = data.insertedId;
    const path = `public/uploads/${req.query.volume}/${req.query.issue}/${req.file.originalname}`;
    const url = `uploads/${req.query.volume}/${req.query.issue}/${req.file.originalname}`;  //updated line
    let pdffile = await db
      .collection("articles")
      .updateOne(
        { _id: mongoid },
        { $set: { pdfdata: req.file, destination: path, fileurl: url } } //updated line
      );

    await connection.close();

    res.json({ message: "success" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "try again later" });
  }
});

app.post("/updatesamepath", upload.single("pdf"), async (req, res, next) => {
  const obj = JSON.parse(JSON.stringify(req.body));

  if (req.file === undefined) {
    try {
      const connection = await mongoClient.connect(URL);

      const db = connection.db(DB);

      let data = await db
        .collection("articles")
        .updateOne({ _id: new mongodb.ObjectId(req.query.id) }, { $set: obj });

      await connection.close();

      res.json({ message: "success" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "try again later" });
    }
  } else {
    try {
      const connection = await mongoClient.connect(URL);

      const db = connection.db(DB);

      let data = await db
        .collection("articles")
        .updateOne({ _id: new mongodb.ObjectId(req.query.id) }, { $set: obj });
      const path = `public/uploads/${req.query.volume}/${req.query.issue}/${req.file.originalname}`;
      const url = `uploads/${req.query.volume}/${req.query.issue}/${req.file.originalname}`; //updated line
      let pdffile = await db
        .collection("articles")
        .updateOne(
          { _id: new mongodb.ObjectId(req.query.id) },
          { $set: { pdfdata: req.file, destination: path, fileurl: url } }//updated line
        );

      var oldfilePath = `public/uploads/${obj.volume}/${obj.issue}/${req.query.oldfile}`;
      fs.unlinkSync(oldfilePath);
      await connection.close();

      res.json({ message: "success" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "try again later" });
    }
  }
});

app.post(
  "/updatediffrentpath",
  upload.single("pdf"),
  async (req, res, next) => {
    const obj = JSON.parse(JSON.stringify(req.body));

    console.log(obj);
    console.log(req.query.oldPath);

    if (req.file === undefined) {
      try {
        const connection = await mongoClient.connect(URL);

        const db = connection.db(DB);
        var fileoldPath = `${obj.destination}`;
        var newdestination = `public/uploads/${obj.volume}/${obj.issue}`;
        if (!fs.existsSync(newdestination)) {
          fs.mkdirSync(newdestination, { recursive: true });
        }
        var newPath = `public/uploads/${obj.volume}/${obj.issue}/${req.query.oldfile}`;
        var url = `uploads/${obj.volume}/${obj.issue}/${req.query.oldfile}`;  //updated line

        fs.rename(fileoldPath, newPath, function (err) {
          if (err) throw err;
          console.log("Successfully moved!");
        });
        let data = await db
          .collection("articles")
          .updateOne(
            { _id: new mongodb.ObjectId(req.query.id) },
            { $set: obj }
          );

        let pdffile = await db.collection("articles").updateOne(
          { _id: new mongodb.ObjectId(req.query.id) },
          {
            $set: {
              fileurl: url,  //updated line
              destination: newPath,
              "pdfdata.path": newPath,
              "pdfdata.destination": newdestination,
            },
          }
        );

        await connection.close();

        res.json({ message: "success" });
      } catch (error) {
        console.log(error);
        res.status(500).json({ message: "try again later" });
      }
    } else {
      try {
        const connection = await mongoClient.connect(URL);

        const db = connection.db(DB);

        var newPath = `public/uploads/${obj.volume}/${obj.issue}/${req.file.originalname}`;
        var url = `uploads/${obj.volume}/${obj.issue}/${req.file.originalname}`;  //updated line
        fs.unlinkSync(obj.destination);

        let data = await db
          .collection("articles")
          .updateOne(
            { _id: new mongodb.ObjectId(req.query.id) },
            { $set: obj }
          );

        let pdffile = await db.collection("articles").updateOne(
          { _id: new mongodb.ObjectId(req.query.id) },
          {
            $set: {
              pdfdata: req.file,
              destination: newPath,
              fileurl: url, //updated line
            },
          }
        );

        await connection.close();

        res.json({ message: "success" });
      } catch (error) {
        console.log(error);
        res.status(500).json({ message: "try again later" });
      }
    }
  }
);

app.listen(process.env.PORT || 3000);
