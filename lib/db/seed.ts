import { db } from './config';
import { users, companies, applications } from './schema';
import { hashPassword } from '../auth';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Create test users
    console.log('Creating users...');
    
    const passwordHash = await hashPassword('password');
    
    await db.insert(users).values([
      {
        email: 'admin@gmail.com',
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true,
      },
      {
        email: 'analyst@gmail.com',
        passwordHash,
        firstName: 'John',
        lastName: 'Analyst',
        role: 'analyst',
        isActive: true,
      },
      {
        email: 'viewer@gmail.com',
        passwordHash,
        firstName: 'Jane',
        lastName: 'Viewer',
        role: 'viewer',
        isActive: true,
      },
    ]);

    console.log('✅ Users created:');
    console.log('   - admin@gmail.com / password (Admin)');
    console.log('   - analyst@gmail.com / password (Analyst)');
    console.log('   - viewer@gmail.com / password (Viewer)');

    // Create test companies
    console.log('\nCreating companies...');
    
    await db.insert(companies).values([
      {
        name: 'TechCorp Industries',
        registrationNumber: 'REG-001-2024',
        registrationType: 'LLC',
        foundedYear: 2020,
        location: 'New York',
        address: '123 Tech Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        phoneNumber: '+1-555-0100',
        email: 'info@techcorp.com',
        website: 'https://techcorp.com',
      },
      {
        name: 'Global Trading Co',
        registrationNumber: 'REG-002-2024',
        registrationType: 'Corporation',
        foundedYear: 2018,
        location: 'San Francisco',
        address: '456 Market Avenue',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        country: 'USA',
        phoneNumber: '+1-555-0200',
        email: 'contact@globaltrading.com',
        website: 'https://globaltrading.com',
      },
      {
        name: 'Manufacturing Solutions Ltd',
        registrationNumber: 'REG-003-2024',
        registrationType: 'Private Limited',
        foundedYear: 2015,
        location: 'Chicago',
        address: '789 Industrial Blvd',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        country: 'USA',
        phoneNumber: '+1-555-0300',
        email: 'info@mfgsolutions.com',
        website: 'https://mfgsolutions.com',
      },
    ]);

    console.log('✅ Companies created: 3 test companies');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Email: admin@gmail.com');
    console.log('   Password: password');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
