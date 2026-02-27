import cloverService from '../services/cloverService.js';

// Webhook Handler
const handleWebhook = async (req, res) => {
    try {
        const event = req.body;
        console.log('Clover Webhook received:', JSON.stringify(event, null, 2));
        // Acknowledge webhook
        res.status(200).send('Webhook received');
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).send('Webhook Error');
    }
};

// Get Checkout Settings from Clover (Tax Rate, Delivery Fee)
const getCheckoutSettings = async (req, res) => {
    try {
        if (!cloverService.isConfigured()) {
            return res.status(200).json({ success: true, taxRate: 0, deliveryFee: 0 });
        }

        const taxRates = await cloverService.getTaxRates();
        let taxRate = 0;
        if (taxRates && taxRates.length > 0) {
            const totalRate = taxRates.reduce((acc, tr) => acc + (tr.rate || 0), 0);
            taxRate = totalRate / 10000000;
        }

        const serviceCharge = await cloverService.getDefaultServiceCharge();
        let deliveryFee = 0;
        if (serviceCharge && serviceCharge.enabled) {
            if (serviceCharge.amount) {
                deliveryFee = serviceCharge.amount / 100;
            }
        }

        res.json({ success: true, taxRate, deliveryFee });
    } catch (error) {
        console.error('Error fetching checkout settings:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export { handleWebhook, getCheckoutSettings };
