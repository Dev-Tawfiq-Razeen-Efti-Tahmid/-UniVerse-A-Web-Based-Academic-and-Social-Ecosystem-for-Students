import { Router } from 'express';
import {MessageRoom} from '../controllers/forumRoomController.js';

const router = Router();


router.get("/", MessageRoom);

export default router;