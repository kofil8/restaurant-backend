import express from 'express';
import { UserRouters } from '../modules/user/user.route';
import { AuthRouters } from '../modules/auth/auth.route';
import { ProfileRouters } from '../modules/profile/profile.route';
import { AdminRouters } from '../modules/dashboard/dashboard.route';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/dashboard',
    route: AdminRouters,
  },
  {
    path: '/auth',
    route: AuthRouters,
  },
  {
    path: '/users',
    route: UserRouters,
  },
  {
    path: '/profile',
    route: ProfileRouters,
  },
  // {
  //   path: '/ratings',
  //   route: Ratingrouter,
  // },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
