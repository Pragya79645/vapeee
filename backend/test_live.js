
import fetch from 'node-fetch';

async function test() {
    const urls = [
        'https://vape-backend-oisar.ondigitalocean.app/api/product/list',
        'https://vape-backend-oisar.ondigitalocean.app/api/logs/list'
    ];
    for (const url of urls) {
        try {
            const response = await fetch(url);
            console.log(`URL: ${url}`);
            console.log(`Status: ${response.status}`);
        } catch (error) {
            console.log(`URL: ${url}`);
            console.error('Error:', error.message);
        }
    }
}
test();
