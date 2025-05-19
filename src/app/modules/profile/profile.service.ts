import httpStatus from 'http-status';
import prisma from '../../helpers/prisma';
import ApiError from '../../errors/ApiError';
import { deleteImageFromS3 } from '../../helpers/DigitalOcan/s3';

const getMyProfileFromDB = async (id: string) => {
  const profile = await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      name: true,
      profileImage: true,
      latitude: true,
      longitude: true,
      athlete: true,
      coach: true,
      promoter: true,
    },
  });

  if (!profile) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return profile;
};

const updateUserProfile = async (id: string, payload: any, file: any) => {
  const existingUser = await prisma.user.findUnique({
    where: { id },
    include: {
      athlete: true,
      coach: true,
      gym: true,
      promoter: true,
    },
  });

  if (!existingUser) {
    throw new Error('User not found');
  }

  const profileImage = file?.location ?? existingUser.profileImage;

  const parsedPayload =
    typeof payload === 'string' ? JSON.parse(payload) : payload;

  let roleData: any = {};
  switch (existingUser.role) {
    case 'ATHLETE':
      roleData = {
        about: parsedPayload.about,
      };
      break;
    case 'COACH':
      roleData = {
        bio: parsedPayload.bio,
      };
      break;
    case 'GYM':
      roleData = {
        description: parsedPayload.description,
      };
      break;
    case 'PROMOTER':
      roleData = {
        location: parsedPayload.location,
      };
      break;
    default:
      break;
  }

  // Use a transaction to update the user and their role-specific profile atomically
  const updatedUser = await prisma.$transaction(async (tx) => {
    const updatedUserData = await tx.user.update({
      where: { id },
      data: {
        name: parsedPayload.name,
        latitude: parsedPayload.latitude,
        longitude: parsedPayload.longitude,
        email: parsedPayload.email,
        profileImage,
      },
    });

    if (existingUser.athlete) {
      await tx.athlete.update({
        where: { id: existingUser.athlete.id },
        data: roleData,
      });
    } else if (existingUser.coach) {
      await tx.coach.update({
        where: { id: existingUser.coach.id },
        data: roleData,
      });
    } else if (existingUser.gym) {
      await tx.gym.update({
        where: { id: existingUser.gym.id },
        data: roleData,
      });
    } else if (existingUser.promoter) {
      await tx.promoter.update({
        where: { id: existingUser.promoter.id },
        data: roleData,
      });
    }

    return updatedUserData;
  });

  return {
    user: {
      id,
      athleteId: existingUser.athlete?.id,
      coachId: existingUser.coach?.id,
      gymId: existingUser.gym?.id,
      promoterId: existingUser.promoter?.id,
      name: updatedUser.name,
      role: existingUser.role,
      profileImage: updatedUser.profileImage,
      latitude: updatedUser.latitude,
      longitude: updatedUser.longitude,
    },
    role: {
      ...roleData,
    },
  };
};

const deleteUser = async (id: string) => {
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
  }

  if (existingUser.profileImage) {
    await deleteImageFromS3(existingUser.profileImage);
  }
  await prisma.user.delete({
    where: {
      id: id,
    },
  });
  return 'User deleted successfully';
};

export const ProfileServices = {
  getMyProfileFromDB,
  updateUserProfile,
  deleteUser,
};
