const express = require("express");
// const bodyParser = require('body-parser');
const { ObjectId } = require("mongodb");
const { connectToDb, getDb } = require("./db");
const logger = require("./logger");
const ApiError = require("./utils/ApiError");

const app = express();

//body parser goes first
app.use(express.json());
// "/public" is the route used to access the public folder
app.use("/public", express.static("public"));

//logger comes below static config and body parser because the first 2 middlewares are directly from express
app.use(logger);

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

//global error handler
app.use((err, req, res, next) => {
  console.log("Error Stack: ", err.stack);

  //returning my converted error contructor as a response
  return res.status(err?.statusCode || 500).json({
    message: err?.message || "An error occurred, please try again later.",
  });
});

connectToDb()
  .then(() => {
    app.listen(process.env.PORT, () =>
      console.log(`Server is running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => {
    console.log("Error starting server: ", err);
  });

const updateLesson = (lessonId, spaces) => {
  const db = getDb();
  const collection = db.collection("lesson");

  collection.findOneAndUpdate(
    { _id: ObjectId(lessonId) },
    { $inc: { spaces: -spaces } },
    (err, result) => {
      if (err) throw err;
    }
  );
};

app.get("/lessons", async (req, res, next) => {
  try {
    const searchText = req.query.search;
    let query = {};

    if (searchText) {
      query = {
        $or: [
          { subject: { $regex: searchText, $options: "i" } },
          { location: { $regex: searchText, $options: "i" } },
        ],
      };
    }

    const db = getDb();
    const collection = db.collection("lesson");
    const items = await collection.find(query).toArray();

    res.send(items);
  } catch (err) {
    next(err);
  }
});

app.post("/orders", async (req, res, next) => {
  try {
    const order = req.body;

    const db = getDb();
    const collection = db.collection("order");

    collection.insertOne(order, (err, result) => {
      if (err) throw err;

      // updateLesson(order.lesson_id, order.spaces);

      res.json(result);
    });
  } catch (err) {
    next(err);
  }
});

app.put("/lessons/:id", (req, res) => {
  const lessonId = req.params.id;
  const spaces = req.body.spaces;

  updateLesson(lessonId, spaces);

  res.send("Lesson updated successfully");
});

//wild card for not found routes
app.all("*", (req, res, next) => {
  return next(new ApiError("Route not found or has been changed", 404));
});
