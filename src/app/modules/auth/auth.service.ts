import * as bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import { Secret } from 'jsonwebtoken';
import config from '../../../config';
import prisma from '../../helpers/prisma';
import ApiError from '../../errors/ApiError';
import { generateOtpReg } from '../../utils/otpGenerateReg';
import { generateToken } from '../../utils/generateToken';

const loginUserFromDB = async (payload: {
  email: string;
  password: string;
  fcmToken?: string;
}) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
    include: {
      athlete: true,
      coach: true,
      gym: true,
    },
  });

  if (!userData) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
  }

  // check is user is verified
  if (!userData.isVerified) {
    const { otp, otpExpiry } = await generateOtpReg({ email: payload.email });

    await prisma.otp.create({
      data: {
        email: payload.email,
        otp,
        expiry: otpExpiry,
      },
    });

    throw new ApiError(
      httpStatus.TEMPORARY_REDIRECT,
      'User is not verified, Please verify your email first',
    );
  }

  const isCorrectPassword = await bcrypt.compare(
    payload.password,
    userData.password as string,
  );

  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid credentials');
  }

  if (userData.isOnline === false) {
    await prisma.user.update({
      where: {
        email: payload.email,
      },
      data: {
        isOnline: true,
      },
    });
  }

  if (payload?.fcmToken) {
    await prisma.user.update({
      where: {
        email: payload.email,
      },
      data: {
        fcmToken: payload.fcmToken,
      },
    });
  }

  //  check if user is verified
  const accessToken = generateToken(
    {
      id: userData.id,
      email: userData.email as string,
      role: userData.role,
      isOnline: userData.isOnline,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string,
  );
  return {
    accessToken,
    id: userData.id,
    athleteId: userData.athlete?.id,
    coachId: userData.coach?.id,
    gymId: userData.gym?.id,
    name: userData.name,
    role: userData.role,
    fcmToken: userData.fcmToken,
  };
};

const logoutUser = async (id: string) => {
  const userData = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });

  if (!userData) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
  }

  if (userData.isOnline === false) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User is already logged out');
  }

  await prisma.user.update({
    where: {
      id: id,
    },
    data: {
      isOnline: false,
      fcmToken: null,
    },
  });
  return;
};

export const AuthServices = { loginUserFromDB, logoutUser };
