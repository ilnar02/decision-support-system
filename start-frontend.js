import { createServer } from 'vite';

async function startFrontend() {
  try {
    const server = await createServer({
      root: './client',
      server: {
        port: 3000,
        proxy: {
          '/api': 'http://localhost:5000'
        }
      }
    });

    await server.listen();
    server.printUrls();
    console.log('Frontend running on http://localhost:3000');
    console.log('Make sure backend is running on http://localhost:5000');
  } catch (error) {
    console.error('Failed to start frontend:', error);
    process.exit(1);
  }
}

startFrontend();