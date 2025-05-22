const axios = require('axios');
axios.get('https://api.dexscreener.com/latest/dex/tokens/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263')
  .then(res => {
    if (res.data && res.data.pairs && res.data.pairs.length > 0) {
      console.log('BONK price (USD):', res.data.pairs[0].priceUsd);
    } else {
      console.log('BONK price not found on DexScreener.');
    }
  })
  .catch(err => {
    console.error('Error fetching BONK price from DexScreener:', err.message);
  }); 