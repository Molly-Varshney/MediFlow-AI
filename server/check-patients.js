const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Patient = require('./models/Patient');
  const patients = await Patient.find({}, 'name email').lean();
  console.log('All patients in DB:');
  patients.forEach(p => console.log(`  ${p.email} - ${p.name}`));
  if (patients.length === 0) console.log('  (none)');
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
