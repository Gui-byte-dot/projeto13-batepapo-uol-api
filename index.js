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
const batepapomsgSchema = joi.object({
  to: joi.string().required(),
  text: joi.string().required(),
  type: joi.string().valid('message', 'private_message').required(),
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
    let participants = await db.collection('participants').find().toArray();
    res.send(participants);
  } catch(error) {
    res.sendStatus(500)
  }
})




app.post('/messages', async (req,res) => {
  const from = req.headers.user;
  const {to, text, type} = req.body;

  if(!from){
    res.sendStatus(401);
    return;
  }
  const validateParticipant = batepapomsgSchema.validate(req.body, {abortEarly : false})
  if(validateParticipant.error){
    const errors = validateParticipant.error.details.map((detail) => detail.message);
    res.status(422).send(errors)
    return 
  }

  try{
    await db.collection('message').insertOne({
      from,
      to,
      text,
      type
    });
    res.sendStatus(201);
  } catch(err) {
    res.sendStatus(err);
  }

})

app.get('/messages', async (req,res) => {
  const limit = parseInt(req.query.limit);
  const from = req.headers.user;

  try{
    let messages = await db.collection('message').find().toArray();
    let msgfiltered = (messages.filter((message) => message.from === from))
    res.send(msgfiltered.slice(msgfiltered.length - limit, msgfiltered.length));
  } catch(error) {
    res.sendStatus(500);
  }
})

app.post('/status', async (req,res) => {
  const usuario = req.headers.user;
  console.log(usuario);
  

  try{
   
    let oneparticipant = await db.collection('participants').findOne({name:usuario})

    if(!oneparticipant){
      res.status(404).send("Usuário não encontrado!");
      return;
    }
    
    await db.collection('participants').updateOne({name: usuario}, {$set: {lastStatus:Date.now()}});
    res.sendStatus(200);
    } catch(error) {
    res.send(error);
  }
 
  // db.student.updateOne({name: "Annu"}, {$set:{age:25}})



})
// let filterDelete = await db.collection('participants').find({name: {$exists:true}}).toArray();
// let filter1 = filterDelete.filter((last) => Date.now() - last.lastStatus < 3600000)
// console.log(filter1)
setInterval(function(){
  db.collection('participants').deleteMany({lastStatus: {"$lt":Date.now() - 3600000}})
},25000)
let filter = await db.collection('participants').find().toArray();
console.log(filter)

// let filterDelete = db.collection('participants').find({ name: {$exists: true} });

// let filter1 = filterDelete.filter((filt,index) => filt.name === "Vasco")
// console.log(filter1[0].name.length)
app.listen(5000, ()=> console.log("Rodando na porta 5000"));
// db.products.find({"things.bottle":{"$exists":true}})

// db.orders.deleteMany( { "stock" : "Brent Crude Futures", "limit" : { $gt : 48.88 } } );
// db.inventory.find( { quantity: { $lt: 20 } } )

// db.myCollection.deleteMany({modifiedOn : {"$lt" : new Date(2021, 12, 20}})
