const bcrypt = require('bcryptjs');
const pool = require('./db');

async function seedUsers() {
  const users = [
    { name: 'Anish Admin', email: 'anish@admin.com', password: 'admin123', role: 'admin' },
    { name: 'Admin Final', email: 'admin_final@demo.com', password: 'admin123', role: 'admin' },
    { name: 'Priya Member', email: 'priya@member.com', password: 'member123', role: 'member' },
    { name: 'Demo Member', email: 'member@demo.com', password: 'member123', role: 'member' }
  ];

  try {
    console.log('🌱 Seeding users into the database...');
    
    for (const u of users) {
      // Check if user exists
      const check = await pool.query('SELECT id FROM users WHERE email = $1', [u.email]);
      
      if (check.rows.length === 0) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(u.password, salt);
        
        await pool.query(
          'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
          [u.name, u.email, hash, u.role]
        );
        console.log(`✅ Created user: ${u.email}`);
      } else {
        console.log(`ℹ️ User already exists: ${u.email}`);
      }
    }
    console.log('✨ Seeding complete!');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  } finally {
    process.exit();
  }
}

seedUsers();
