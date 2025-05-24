import app from './app';
import { initMoralis } from './lib/moralis';

const PORT = process.env.PORT || 3001;

(async () => {
  try {
    await initMoralis();
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize Moralis:', error);
    process.exit(1);
  }
})(); 