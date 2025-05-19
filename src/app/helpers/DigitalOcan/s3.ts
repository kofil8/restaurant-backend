import { S3Client } from '@aws-sdk/client-s3';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import config from '../../../config';

export const s3 = new S3Client({
  endpoint: config.do_space_endpoint,
  region: config.do_region || process.env.DO_REGION,
  credentials: {
    accessKeyId: config.do_space_accesskey || '',
    secretAccessKey: config.do_space_secret_key || '',
  },
});

export const deleteImageFromS3 = async (imageUrl: string): Promise<void> => {
  try {
    const url = new URL(imageUrl);
    const imageKey = url.pathname.substring(1);

    const deleteParams = {
      Bucket: config.do_space_bucket,
      Key: imageKey,
    };

    // Send the delete request to S3
    await s3.send(new DeleteObjectCommand(deleteParams));
    console.log(`Image ${imageKey} deleted from S3.`);
  } catch (error) {
    console.error('Error deleting image from S3:', error);
    throw new Error('Failed to delete image from S3');
  }
};
