const bcrypt = require('bcryptjs');

const password = '32004001@T5$56';
const saltRounds = 12;

console.log('Generating password hash for:', password);
console.log('');

bcrypt.hash(password, saltRounds, function(err, hash) {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Password hash to use in database:');
    console.log(hash);
    console.log('');
    console.log('SQL to update admin:');
    console.log(`UPDATE admins SET password_hash = '${hash}' WHERE email = 'taharou7@gmail.com';`);
    console.log('');

    // Test the hash
    bcrypt.compare(password, hash, function(err, result) {
      if (err) {
        console.error('Comparison error:', err);
      } else {
        console.log('Password verification test:', result ? '✓ SUCCESS' : '✗ FAILED');
      }
    });
  }
});
