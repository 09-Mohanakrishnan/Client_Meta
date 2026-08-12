import express from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validate.js';
import { userCreateSchema, userUpdateSchema } from '../validators/schemas.js';

const router = express.Router();

router.use(protect);
router.use(authorize('SUPER_ADMIN'));

router.get('/', getUsers);
router.post('/', validate(userCreateSchema), createUser);
router.patch('/:id', validate(userUpdateSchema), updateUser);
router.delete('/:id', deleteUser);

export default router;
