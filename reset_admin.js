const bcrypt = require('bcryptjs');
const pool = require('./db');

async function resetPassword() {
  const email = 'anish@admin.com';
  const newPassword = 'TaskFlow_Admin_2026!';
  
  try {
    console.log(`🔄 Updating password for ${email}...`);
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2',
      [hash, email]
    );
    
    if (result.rowCount > 0) {
      console.log('✅ Password updated successfully!');
      console.log('-----------------------------------');
      console.log(`Email: ${email}`);
      console.log(`New Password: ${newPassword}`);
      console.log('-----------------------------------');
    } else {
      console.log('❌ User not found.');
    }
  } catch (error) {
    console.error('❌ Error updating password:', error.message);
  } finally {
    process.exit();
  }
}

resetPassword();
