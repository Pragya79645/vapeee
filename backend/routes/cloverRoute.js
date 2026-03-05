import express from 'express';
import { handleWebhook, getCheckoutSettings, getCloverStatus } from '../controllers/cloverController.js';

const router = express.Router();

router.post('/webhook', handleWebhook);
router.get('/checkout-settings', getCheckoutSettings);
router.get('/status', getCloverStatus);

export default router;
