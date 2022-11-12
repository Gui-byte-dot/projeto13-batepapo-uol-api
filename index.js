import express from 'express';
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from 'mongodb';
import joi from 'joi';
import dayjs from 'dayjs';


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

const batepapoSchema = joi.object({
  name: joi.string().required(),
})

app.post('/participants', async (req, res) => {
  const {name} = req.body;

  const validation = batepapoSchema.validate(req.body, {abortEarly : false})

  if(validation.error){
    const errors = validation.error.details.map((detail) => detail.message);
    res.status(422).send(errors)
    return 
  }
  try{
    const isUser = await db.collection('participants').findOne({name: name})
    
    if(isUser){
      return res.sendStatus(409);
    }
    await db.collection('participants').insertOne({
      name,
      lastStatus: Date.now()
    })
    await db.collection('participants').insertOne({
      from: name,
      to: 'Todos', 
      text: 'entra na sala...', 
      type: 'status', 
      time: dayjs().format("HH:mm:ss")
    });
    res.sendStatus(201);

  } catch(err) {
    res.sendStatus(err);
  }


})

app.get('/participants', async (req,res) => {
  try{
    const participants = await db.collection('participants').find().toArray();
    res.send(participants);
  } catch(error) {
    res.sendStatus(500)
  }
})




// app.post('/messages', async (req,res) => {
//   const from = req.headers.user;
//   const {to, text, type} = req.body;

//   if(!from){
//     res.sendStatus(401);
//     return;
//   }
//   const validateParticipant = batepapoSchema.validate(req.body, {abortEarly : false})
//   if(validateParticipant.error){
//     const errors = validateParticipant.error.details.map((detail) => detail.message);
//     res.status(422).send(errors)
//     return 
//   }

//   try{
//     const typeMessage = await db.collection('messages').findOne({type:'message'})
//     const typePrivate = await db.collection('messages').findOne({type:'private_message'})
//     if(!typeMessage && !typePrivate){
//       return res.sendStatus(422)
//     }
//     await db.collection('message').insertOne({
//       to,
//       text,
//       type
//     });
//     res.sendStatus(201);
//   } catch(err) {
//     res.sendStatus(err);
//   }

// })

app.listen(5000, ()=> console.log("Rodando na porta 5000"));

