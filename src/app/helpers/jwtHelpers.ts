import jwt, {
  Secret,
  SignOptions,
  VerifyErrors,
  JwtPayload,
} from 'jsonwebtoken';

interface CustomJwtPayload extends JwtPayload {
  userId: string;
}

const generateToken = (
  payload: CustomJwtPayload,
  secret: Secret,
  expiresIn: SignOptions['expiresIn'] = '1d',
  algorithm: jwt.Algorithm = 'HS256',
): string => {
  return jwt.sign(payload, secret, { algorithm, expiresIn });
};

const verifyToken = (token: string, secret: Secret): CustomJwtPayload => {
  try {
    return jwt.verify(token, secret) as CustomJwtPayload;
  } catch (error) {
    const err = error as VerifyErrors;
    throw new Error(`Token verification failed: ${err.message}`);
  }
};

export const jwtHelpers = {
  generateToken,
  verifyToken,
};
