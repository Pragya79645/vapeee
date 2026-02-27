
import axios from 'axios';

async function test() {
    try {
        const response = await axios.get('http://localhost:3000/api/logs/list');
        console.log('Status:', response.status);
    } catch (error) {
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}
test();
