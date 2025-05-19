import { NextFunction, Request, Response } from 'express';
import { JwtPayload, Secret } from 'jsonwebtoken';
import config from '../../config';
import httpStatus from 'http-status';
import { jwtHelpers } from '../../helpars/jwtHelpers';
import ApiError from '../errors/ApiError';
import prisma from '../helpers/prisma';

const auth = (...roles: string[]) => {
  return async (
    req: Request & { user?: any },
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
      }

      const token = authHeader.split(' ')[1];

      const verifiedUser = jwtHelpers.verifyToken(
        token,
        config.jwt.jwt_secret as Secret,
      );

      if (!verifiedUser?.email) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
      }
      const { id } = verifiedUser;

      const user = await prisma.user.findUnique({
        where: {
          id: id,
        },
      });
      if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found!');
      }

      req.user = verifiedUser as JwtPayload;

      if (roles.length && !roles.includes(verifiedUser.role)) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          'Forbidden! You are not authorized!',
        );
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

export default auth;
