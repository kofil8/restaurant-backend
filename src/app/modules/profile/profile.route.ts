import express from 'express';
import parseBodyData from '../../../helpars/parseBodyData';
import auth from '../../middlewares/auth';
import { ProfileControllers } from './profile.controller';
import { fileUploaders3 } from '../../helpers/DigitalOcan/s3fileUploader';

const router = express.Router();

router.get('/me', auth(), ProfileControllers.getMyProfile);
router.patch(
  '/update',
  auth(),
  parseBodyData,
  fileUploaders3.uploadProfileImage,
  ProfileControllers.updateMyProfile,
);

router.delete('/:id', auth(), ProfileControllers.deleteUser);

export const ProfileRouters = router;
