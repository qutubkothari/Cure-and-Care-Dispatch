import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import * as readline from 'readline';

const prisma = new PrismaClient();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

async function createAdminUser() {
  try {
    console.log('\n🔧 Admin User Creation\n');

    const email = await question('Email: ');
    const password = await question('Password: ');
    const name = await question('Name: ');
    const phone = await question('Phone (optional): ');

    if (!email || !password || !name) {
      console.error('❌ Email, password, and name are required!');
      process.exit(1);
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      console.error('❌ User with this email already exists!');
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone: phone || null,
        role: 'ADMIN',
        isActive: true
      }
    });

    console.log('\n✅ Admin user created successfully!');
    console.log(`\n📧 Email: ${admin.email}`);
    console.log(`👤 Name: ${admin.name}`);
    console.log(`🔑 Role: ${admin.role}`);
    console.log(`\nYou can now login with these credentials.\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createAdminUser();
