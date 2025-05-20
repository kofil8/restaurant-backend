import jwt, { Secret, SignOptions } from 'jsonwebtoken';

export const generateToken = (
  payload: Record<string, unknown>,
  secret: Secret,
  expiresIn: string,
): string => {
  const token = jwt.sign(payload, secret, <SignOptions>{
    algorithm: 'HS256',
    expiresIn,
  });

  return token;
};
