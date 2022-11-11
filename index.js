import express from 'express';
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from 'mongodb';
// import joi from 'joi';


const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;


try {
    await mongoClient.connect();
    db = mongoClient.db("batepapouol");
  } catch (err) {
    console.log(err);
}
// const batepapoSchema = 
app.post('/participants')

app.listen(5000, ()=> console.log("Rodando na porta 5000"));

