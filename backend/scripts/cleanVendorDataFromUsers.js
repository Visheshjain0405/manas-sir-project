import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const cleanDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // 1. Delete legacy vendor records completely
    const deleteResult = await usersCollection.deleteMany({
      $or: [{ role: 'vendor' }, { businessName: { $exists: true, $ne: "" } }]
    });
    console.log(`✅ Deleted ${deleteResult.deletedCount} legacy vendor records from 'users' collection.`);

    // 2. Unset leftover vendor fields from remaining customer records
    const updateResult = await usersCollection.updateMany(
      {},
      {
        $unset: {
          businessName: "",
          category: "",
          subServices: "",
          experienceYears: "",
          pincodes: "",
          isOnline: ""
        }
      }
    );
    console.log(`✅ Cleaned up leftover vendor fields from ${updateResult.modifiedCount} customer records.`);

    // 3. Count remaining customer records
    const remainingCount = await usersCollection.countDocuments();
    console.log(`📊 Remaining customer records in 'users' collection: ${remainingCount}`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    console.log('Disconnecting...');
    await mongoose.disconnect();
    console.log('Done.');
  }
};

cleanDatabase();
