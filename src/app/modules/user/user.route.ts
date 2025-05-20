import { UserRole } from '@prisma/client';
import express from 'express';
import parseBodyData from '../../../helpars/parseBodyData';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { UserControllers } from './user.controller';
import { UserValidations } from './user.validation';
import { fileUploaders3 } from '../../helpers/DigitalOcan/s3fileUploader';

const router = express.Router();

router.post(
  '/register',
  fileUploaders3.uploadProfileImage,
  parseBodyData,
  UserControllers.registerUser,
);

router.post(
  '/verify-otp',
  validateRequest(UserValidations.verifyOtp),
  UserControllers.verifyOtp,
);

router.post(
  '/resend-otp-reg',
  validateRequest(UserValidations.resendOtp),
  UserControllers.resendOtpReg,
);
router.post(
  '/reset-password',
  auth(),
  validateRequest(UserValidations.resetPassword),
  UserControllers.resetPassword,
);

router.get('/', auth(UserRole.ADMIN), UserControllers.getAllUsers);

router.get('/:id', auth(UserRole.ADMIN), UserControllers.getUserById);

router.post(
  '/forgot-password',
  validateRequest(UserValidations.forgotPassword),
  UserControllers.forgotPassword,
);

router.post(
  '/resend-otp-rest',
  validateRequest(UserValidations.resendOtp),
  UserControllers.resendOtpRest,
);

router.post(
  '/change-password',
  validateRequest(UserValidations.changePassword),
  auth(),
  UserControllers.changePassword,
);

router.post(
  '/reset-otp',
  validateRequest(UserValidations.verifyOtp),
  UserControllers.ResetOtpVerify,
);

router.post(
  '/verify-reset-otp',
  validateRequest(UserValidations.verifyOtp),
  UserControllers.ResetOtpVerify,
);

export const UserRouters = router;
