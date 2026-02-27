import express from 'express';
import { getLogs } from '../controllers/logController.js';
import { verifyAdmin as adminAuth } from '../middleware/authMiddleware.js';

const logRoute = express.Router();

logRoute.get('/list', adminAuth, getLogs);

export default logRoute;
