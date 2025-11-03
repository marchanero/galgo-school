// Prueba de validación de rutas RTSP
const rtspConfig = require('./server/src/config/rtsp.config');

const testCameras = [
  {
    name: 'Cámara Principal',
    ip: '192.168.8.210',
    port: 554,
    username: 'admin',
    password: 'galgo2526',
    path: '/h264Preview_01_main',
    protocol: 'rtsp'
  },
  {
    name: 'Cámara 2',
    ip: '192.168.8.210',
    port: 554,
    username: 'admin',
    password: 'galgo2526',
    path: '/stream',
    protocol: 'rtsp'
  },
  {
    name: 'Cámara 3',
    ip: '192.168.1.1',
    port: 554,
    path: '/Preview_01_main',
    protocol: 'rtsp'
  }
];

console.log('=== Validación de configuraciones de cámara ===\n');

testCameras.forEach((camera, index) => {
  const validation = rtspConfig.validateCameraConfig(camera);
  console.log(`Cámara ${index + 1}: ${camera.name}`);
  console.log(`  Ruta: ${camera.path}`);
  console.log(`  Válida: ${validation.isValid}`);
  if (!validation.isValid) {
    console.log('  Errores:');
    validation.errors.forEach(err => console.log(`    - ${err}`));
  }
  console.log();
});

// Test específico de regex
console.log('=== Test de Regex de Ruta ===\n');
const pathRegex = /^\/[a-zA-Z0-9\-_.~!$&'()*+,;=:@%]*$/;
const testPaths = [
  '/h264Preview_01_main',
  '/Preview_01_main',
  '/stream',
  '/camera/preview',
  '/h264/preview',
  '/'
];

testPaths.forEach(path => {
  const matches = pathRegex.test(path);
  console.log(`  ${path}: ${matches ? '✓' : '✗'}`);
});
