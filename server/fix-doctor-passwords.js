const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('doctor123', salt);

  // Use raw MongoDB update to bypass Mongoose hooks
  const result = await mongoose.connection.db
    .collection('doctors')
    .updateMany(
      { $or: [{ password: { $exists: false } }, { password: null }] },
      { $set: { password: hash } }
    );

  console.log(`✅ Updated ${result.modifiedCount} doctors with default password: doctor123`);
  console.log('You can now login with any doctor email + password: doctor123');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
