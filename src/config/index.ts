import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  database_url: process.env.DATABASE_URL,
  env: process.env.NODE_ENV,
  smtp_image_url: process.env.SMTP_IMAGE_URL,
  frontend_url: process.env.FRONTEND_URL,
  backend_image_url: process.env.BACKEND_IMAGE_URL,
  backend_base_url: process.env.BACKEND_BASE_URL,
  do_space_endpoint: process.env.DO_SPACE_ENDPOINT,
  do_space_accesskey: process.env.DO_SPACE_ACCESS_KEY_ID,
  do_space_secret_key: process.env.DO_SPACE_SECRET_ACCESS_KEY,
  do_space_bucket: process.env.DO_SPACE_BUCKET,
  do_region: process.env.DO_REGION,
  aws_access_key_id: process.env.AWS_ACCESS_KEY_ID,
  aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
  aws_region: process.env.AWS_REGION,
  aws_bucket: process.env.AWS_BUCKET,
  super_admin_name: process.env.SUPER_ADMIN_NAME as string,
  super_admin_email: process.env.SUPER_ADMIN_EMAIL as string,
  super_admin_password: process.env.SUPER_ADMIN_PASSWORD as string,
  super_admin_phone: process.env.SUPER_ADMIN_PHONE as string,
  port: process.env.PORT || 9001,
  salt: process.env.SALT || 12,
  jwt: {
    jwt_secret: process.env.JWT_SECRET,
    expires_in: process.env.EXPIRES_IN,
    refresh_token_secret: process.env.REFRESH_TOKEN_SECRET,
    refresh_token_expires_in: process.env.REFRESH_TOKEN_EXPIRES_IN,
    reset_pass_secret: process.env.RESET_PASS_TOKEN,
    reset_pass_token_expires_in: process.env.RESET_PASS_TOKEN_EXPIRES_IN,
  },
  reset_pass_link: process.env.RESET_PASS_LINK,
  emailSender: {
    email: process.env.EMAIL,
    app_pass: process.env.EMAIL_PASSWORD,
  },
  s3: {
    do_space_endpoint: process.env.DO_SPACE_ENDPOINT,
    do_space_accesskey: process.env.DO_SPACE_ACCESS_KEY,
    do_space_secret_key: process.env.DO_SPACE_SECRET_KEY,
    do_space_bucket: process.env.DO_SPACE_BUCKET,
  },
  twlio: {
    account_sid: process.env.TWILIO_ACCOUNT_SID,
    auth_token: process.env.TWILIO_AUTH_TOKEN,
    phone_number: process.env.TWILIO_PHONE_NUMBER,
  },
};
