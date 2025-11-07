import mongoose from 'mongoose';
import User from './src/models/User.model.js';
import dotenv from 'dotenv';

dotenv.config();

const updateUserRole = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({}).select('firstName lastName email role');

    console.log('\n=== Current Users ===');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} - ${user.email} - Role: ${user.role}`);
    });

    // UPDATE THIS LINE: Change the email to your email address
    const emailToUpdate = 'nusetorfoster72@gmail.com';  // <-- CHANGE THIS
    const newRole = 'pastor';  // Options: 'admin', 'pastor', 'sound_engineer', 'member'

    // Find and update the user
    const user = await User.findOne({ email: emailToUpdate });

    if (user) {
      user.role = newRole;
      await user.save();
      console.log(`\n✓ Successfully updated ${emailToUpdate} to role: ${newRole}`);
    } else {
      console.log(`\n✗ User with email ${emailToUpdate} not found`);
      console.log('\nAvailable emails:');
      users.forEach(u => console.log(`  - ${u.email}`));
    }

    mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
};

updateUserRole();
