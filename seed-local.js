import dotenv from 'dotenv';
import { seedDatabase } from './server/seed.js';

// Load environment variables from .env file
dotenv.config();

seedDatabase()
  .then(() => {
    console.log('Database seeded successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  });