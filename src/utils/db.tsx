const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PWD}@cluster0.8bccj.mongodb.net/ecommerce-db?retryWrites=true&w=majority`;
let dbh = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const dbConnection = async () => {
  await dbh.connect();
  return dbh.db("ecommerce-db");
};

module.exports = { dbConnection };
