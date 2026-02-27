import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

/**
 * Uploads a file to vgy.me
 * @param {string} filePath - Absolute path to the file
 * @returns {Promise<{url: string, image: string}>}
 */
export const uploadToVgyMe = async (filePath) => {
    const userkey = process.env.VGYME;
    if (!userkey) {
        throw new Error('VGYME API key not found in environment variables');
    }

    const form = new FormData();
    form.append('userkey', userkey);
    form.append('file[]', fs.createReadStream(filePath));

    const response = await fetch('https://vgy.me/upload', {
        method: 'POST',
        body: form
    });

    const data = await response.json();

    if (data.error) {
        throw new Error(`vgy.me upload error: ${data.message || 'Unknown error'}`);
    }

    return {
        url: data.image, // Direct link
        image: data.image
    };
};
