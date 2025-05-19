import { Router } from 'express';
import auth from '../../middlewares/auth';
import { ratingController } from './rating.controller';
const router = Router();

router.post('/create/:rateeId', auth(), ratingController.createRating);
router.get('/', auth(), ratingController.getRatingByUser);
router.get('/average/:userId', auth(), ratingController.getratingAvarage);

export const Ratingrouter = router;
