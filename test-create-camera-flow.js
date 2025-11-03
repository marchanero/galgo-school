// Test para simular la creación de cámara
const rtspConfig = require('./server/src/config/rtsp.config');

const testCameraPayload = {
  name: 'Cámara Principal',
  ip: '192.168.8.210',
  port: 554,
  username: 'admin',
  password: 'galgo2526',
  path: '/h264Preview_01_main',
  protocol: 'rtsp'
};

console.log('=== Prueba de Creación de Cámara ===\n');
console.log('Payload enviado:');
console.log(JSON.stringify(testCameraPayload, null, 2));
console.log('\n--- Validación ---');

const validation = rtspConfig.validateCameraConfig({
  name: testCameraPayload.name,
  ip: testCameraPayload.ip,
  port: testCameraPayload.port || rtspConfig.rtsp.defaultPort,
  path: testCameraPayload.path || rtspConfig.rtsp.defaultPath,
  protocol: testCameraPayload.protocol || 'rtsp'
});

console.log('Válido:', validation.isValid);
if (!validation.isValid) {
  console.log('Errores:');
  validation.errors.forEach(err => console.log(`  - ${err}`));
}

// Validaciones adicionales del negocio
console.log('\n--- Validaciones Adicionales ---');
if (testCameraPayload.name.length < 2) {
  console.log('❌ El nombre debe tener al menos 2 caracteres');
} else {
  console.log('✓ Nombre válido');
}

if (testCameraPayload.username && testCameraPayload.username.length > 0) {
  console.log('✓ Username proporcionado');
} else {
  console.log('⚠ Username no proporcionado (opcional)');
}

if (!testCameraPayload.password) {
  console.log('⚠ Password vacío o no proporcionado');
} else {
  console.log('✓ Password proporcionado');
}

console.log('\n--- Datos que se insertar\u00edan en la BD ---');
console.log('INSERT INTO rtsp_cameras (name, ip, port, username, password, path, protocol)');
console.log(`VALUES (?, ?, ?, ?, ?, ?, ?)`);
console.log(`Parameters: [${[
  testCameraPayload.name.trim(),
  testCameraPayload.ip.trim(),
  testCameraPayload.port || rtspConfig.rtsp.defaultPort,
  testCameraPayload.username?.trim() || '',
  testCameraPayload.password || '',
  testCameraPayload.path || rtspConfig.rtsp.defaultPath,
  testCameraPayload.protocol || 'rtsp'
].map(v => JSON.stringify(v)).join(', ')}]`);
