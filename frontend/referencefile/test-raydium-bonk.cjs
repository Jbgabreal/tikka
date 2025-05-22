const axios = require('axios');
axios.get('https://api.raydium.io/v2/main/price').then(res => {
  console.log('BONK:', res.data['BONK']);
}).catch(err => {
  console.error('Error fetching BONK price from Raydium:', err.message);
}); 