import { UserRole } from '@prisma/client';
import config from '../../config';
import prisma from '../helpers/prisma';

const superAdminData = {
  name: config.super_admin_name,
  email: config.super_admin_email,
  password: config.super_admin_password,
  role: UserRole.SUPER_ADMIN,
  isVerified: true,
};

const seedSuperAdmin = async () => {
  try {
    const isSuperAdminExists = await prisma.user.findFirst({
      where: {
        role: UserRole.SUPER_ADMIN,
      },
    });

    // If not, create one
    if (!isSuperAdminExists) {
      await prisma.user.create({
        data: superAdminData,
      });
      console.log('Super Admin created 🚀:');
    } else {
      return;
      console.log('Super Admin already exists.');
    }
  } catch (error) {
    console.error('Error seeding Super Admin:', error);
  }
};

export default seedSuperAdmin;
