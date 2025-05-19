import multer from 'multer';
import multerS3 from 'multer-s3';
import { s3 } from './s3';
import config from '../../../config';

const s3Storage = multerS3({
  s3: s3,
  bucket: config.aws_bucket!,
  acl: 'public-read',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: s3Storage,
  limits: { fileSize: 1024 * 1024 * 5 },
});

// Single image uploads
const uploadProfileImage = upload.single('profileImage');
const uploadEventImage = upload.single('eventImage');

// Multiple image uploads
const uploadMultipleImages = upload.array('images', 10);

export const fileUploaders3 = {
  upload,
  uploadProfileImage,
  uploadEventImage,
  uploadMultipleImages,
};
