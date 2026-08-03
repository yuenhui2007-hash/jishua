require('dotenv').config();
const bcrypt = require('bcryptjs');
const { db, initDatabase } = require('./database');

function seed() {
  initDatabase();

  // Create default admin user if none exists
  const existingAdmin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  
  if (!existingAdmin) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@jishua.ai';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const passwordHash = bcrypt.hashSync(adminPassword, 10);

    const result = db.prepare(
      'INSERT INTO users (email, password_hash, first_name, last_name, role, subscription_tier) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(adminEmail, passwordHash, 'System', 'Admin', 'admin', 'enterprise');

    console.log(`Admin user created:`);
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    console.log(`  ID: ${result.lastInsertRowid}`);
  } else {
    console.log('Admin user already exists. Skipping seed.');
  }

  console.log('Seed complete.');
}

seed();
