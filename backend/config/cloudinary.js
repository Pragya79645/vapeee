import { v2 as cloudinary } from 'cloudinary';

const connectCloudinary = () => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET && process.env.CLOUDINARY_API_SECRET.trim();

    if (!cloudName || !apiKey || !apiSecret) {
        console.error('Cloudinary config variables missing or empty');
        console.error('CLOUDINARY_CLOUD_NAME present:', !!cloudName);
        console.error('CLOUDINARY_API_KEY present:', !!apiKey);
        console.error('CLOUDINARY_API_SECRET present:', !!apiSecret);
        process.exit(1);
    }

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret
    });

    // Log masked values to help debugging signature issues
    const mask = (s) => (typeof s === 'string' && s.length > 6) ? s.slice(0, 3) + '...' + s.slice(-3) : s;
    console.log('Cloudinary configured successfully');
    console.log('CLOUDINARY_CLOUD_NAME:', cloudName);
    console.log('CLOUDINARY_API_KEY:', mask(apiKey));
    console.log('CLOUDINARY_API_SECRET:', mask(apiSecret));
};

export default connectCloudinary;
