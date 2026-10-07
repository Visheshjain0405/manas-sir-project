import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  const requests = await db.collection('servicerequests').find({}).toArray();
  console.log('Total requests in DB:', requests.length);
  if (requests.length > 0) {
    console.log('Sample user ID:', requests[0].user);
    console.log('Sample status:', requests[0].status);
  }
  process.exit(0);
});
