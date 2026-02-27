
import fetch from 'node-fetch';

async function test() {
    try {
        const response = await fetch('http://localhost:3000/api/logs/list');
        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Data:', data);
    } catch (error) {
        console.error('Error:', error.message);
    }
}
test();
