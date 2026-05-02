const mongoose = require('mongoose');
require('dotenv').config();
const Doctor = require('./models/Doctor');

async function test() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mediflow');
  
  const doctors = await Doctor.find().lean();
  console.log('--- DOCTORS COLLECTION CONTENTS ---');
  console.log(JSON.stringify(doctors, null, 2));

  mongoose.connection.close();
}

test();
