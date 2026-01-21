import app from './app';
import { serverConfig } from './config';

const PORT = serverConfig.port;

app.listen(PORT, () => {
  console.log('🚀 Server started!');
  console.log(`📡 Environment: ${serverConfig.nodeEnv}`);
  console.log(`🔗 URL: ${serverConfig.apiUrl}`);
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log('');
  console.log('📋 Available endpoints:');
  console.log('  GET  /api/health');
  console.log('  POST /api/auth/login');
  console.log('  POST /api/auth/logout');
  console.log('  POST /api/auth/refresh');
  console.log('  GET  /api/auth/me');
  console.log('  POST /api/users (admin)');
  console.log('  GET  /api/users (admin)');
  console.log('  GET  /api/users/:id (admin)');
  console.log('  PATCH /api/users/:id (admin)');
  console.log('  DELETE /api/users/:id (admin)');
  console.log('  GET  /api/users/profile/me');
  console.log('  PATCH /api/users/profile/me');
  console.log('  PATCH /api/users/profile/password');
  console.log('');
  console.log('✅ Ready to accept connections!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully...');
  process.exit(0);
});
