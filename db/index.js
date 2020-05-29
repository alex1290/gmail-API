import PostgreConfig from "./dbConfig";
import { Client } from "pg";

const postgreSQL = async (callback) => {
  const postClient = new Client(PostgreConfig.postgresSQL);
  const err = await postClient.connect();
  if (err) callback("PostgreSQL connect failed", null);
  console.log("PostgreSQL is connecting...");
  callback(null, postClient);
};

/*
postgreSQL(() => {
  console.log("Connect to PostgreSQL");
});*/

export default postgreSQL;
