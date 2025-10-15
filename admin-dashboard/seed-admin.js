// Seed admin user script
// Run with: node seed-admin.js
import bcrypt from 'bcryptjs';

const password = 'admin123'; // Default password
const saltRounds = 12;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    return;
  }

  console.log('Password hashed successfully!');
  console.log('');
  console.log('Use this SQL to create admin user:');
  console.log('');
  console.log(`INSERT INTO admins (email, password_hash, name, role)`);
  console.log(`VALUES ('admin@rimmarsa.com', '${hash}', 'Admin User', 'super_admin');`);
  console.log('');
  console.log('Login credentials:');
  console.log('Email: admin@rimmarsa.com');
  console.log('Password: admin123');
});
