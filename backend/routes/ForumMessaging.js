import { Router } from 'express';
import {MessageRoom} from '../controllers/forumRoomController.js';

const router = Router({ mergeParams: true }); // Allow access to parent route params


router.get("/", MessageRoom);

export default router;