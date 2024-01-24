const { MongoClient, ServerApiVersion } = require("mongodb");

const dotenv = require("dotenv");
dotenv.config();

let connection;

const uri = process.env.DB_URL;

const getDb = () => {
  if (!connection) {
    throw new Error("Call connectToDb() before calling getDb()");
  }
  return connection.db("Coursework2");
};

module.exports = { connectToDb, getDb };
