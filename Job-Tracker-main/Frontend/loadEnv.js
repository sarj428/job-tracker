const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envFilePath = path.resolve(__dirname, '.env');
if (fs.existsSync(envFilePath)) {
  dotenv.config({ path: envFilePath });
  console.log('Environment variables loaded from .env file');
} else {
  console.log('.env file not found');
}
