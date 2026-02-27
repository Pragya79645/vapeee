import express from 'express';
import { handleWebhook, getCheckoutSettings } from '../controllers/cloverController.js';

const router = express.Router();

router.post('/webhook', handleWebhook);
router.get('/checkout-settings', getCheckoutSettings);

export default router;
