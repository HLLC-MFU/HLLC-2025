import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load .env file
dotenv.config({ path: join(__dirname, '../../.env') });

const config = {
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/hllc-2025',
};

async function updateUserPermissions(): Promise<void> {
  console.log('🔄 Starting User Role Permissions Update');
  console.log(`📡 Connecting to MongoDB: ${config.mongoUri}`);

  const client = new MongoClient(config.mongoUri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const rolesCollection = db.collection('roles');

    // Update User role permissions
    const result = await rolesCollection.updateOne(
      { name: 'User' },
      {
        $set: {
          permissions: ['users:read:id', 'users:update:id'],
          updatedAt: new Date(),
        },
      },
    );

    const result2 = await rolesCollection.updateOne(
      {name : 'Administrator'},
    {
        $set: {
          permissions: ['*'],
          updatedAt: new Date(),
        },
      },
    );
    
    if (result.matchedCount === 0) {
      console.log('⚠️ No User role found to update');
    } else {
      console.log('✅ Successfully updated User role permissions');
      console.log(`Modified ${result.modifiedCount} document(s)`);
    }

    if (result2.matchedCount === 0) {
      console.log('⚠️ No Administrator role found to update');
    } else {
      console.log('✅ Successfully updated Administrator role permissions');
      console.log(`Modified ${result2.modifiedCount} document(s)`);
    }
  } catch (error) {
    console.error('❌ Error updating permissions:', error);
    throw error;
  } finally {
    await client.close();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Run the migration
updateUserPermissions()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
