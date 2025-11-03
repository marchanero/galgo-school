#!/usr/bin/env node

/**
 * Script de prueba para verificar el funcionamiento del streaming RTSP
 */

const http = require('http');

const SERVER_URL = 'http://127.0.0.1:3001';

async function testEndpoint(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Iniciando pruebas del sistema RTSP...\n');

  try {
    // 1. Verificar que el servidor está corriendo
    console.log('1️⃣ Verificando servidor...');
    const healthCheck = await testEndpoint(`${SERVER_URL}/api/health`);
    if (healthCheck.status !== 200) {
      throw new Error(`Servidor no responde correctamente: ${healthCheck.status}`);
    }
    console.log('✅ Servidor funcionando correctamente\n');

    // 2. Verificar que hay cámaras configuradas
    console.log('2️⃣ Verificando cámaras configuradas...');
    const camerasResponse = await testEndpoint(`${SERVER_URL}/api/rtsp/cameras`);
    if (camerasResponse.status !== 200) {
      throw new Error(`Error al obtener cámaras: ${camerasResponse.status}`);
    }

    const cameras = camerasResponse.data.cameras || [];
    console.log(`✅ Encontradas ${cameras.length} cámaras configuradas`);

    if (cameras.length === 0) {
      console.log('⚠️ No hay cámaras configuradas. Creando una de prueba...');

      // Crear una cámara de prueba (usando datos ficticios)
      const testCamera = {
        name: 'Cámara de Prueba',
        ip: '127.0.0.1',
        port: 554,
        username: '',
        password: '',
        path: '/test',
        protocol: 'rtsp'
      };

      const createResponse = await testEndpoint(`${SERVER_URL}/api/rtsp/cameras`, 'POST', testCamera);
      if (createResponse.status !== 201) {
        console.log('❌ No se pudo crear cámara de prueba');
      } else {
        console.log('✅ Cámara de prueba creada');
        cameras.push(createResponse.data.camera);
      }
    }

    // 3. Probar iniciar un stream (si hay cámaras)
    if (cameras.length > 0) {
      const camera = cameras[0];
      console.log(`\n3️⃣ Probando stream para cámara: ${camera.name} (${camera.ip}:${camera.port})`);

      // Iniciar stream
      const startResponse = await testEndpoint(`${SERVER_URL}/api/stream/preview/${camera.id}`, 'POST');
      if (startResponse.status !== 201 && startResponse.status !== 200) {
        console.log(`❌ Error al iniciar stream: ${startResponse.status}`);
        console.log('Respuesta:', startResponse.data);
      } else {
        console.log('✅ Stream iniciado correctamente');
        console.log('HLS URL:', startResponse.data.hlsUrl);

        // Esperar un poco para que ffmpeg genere archivos
        console.log('⏳ Esperando 5 segundos para que ffmpeg genere archivos...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Verificar que el archivo HLS existe
        const hlsResponse = await testEndpoint(`${SERVER_URL}/api/stream/hls/${camera.id}`);
        if (hlsResponse.status === 200) {
          console.log('✅ Archivo M3U8 disponible');
          console.log('Contenido del playlist (primeras líneas):');
          const content = hlsResponse.data;
          if (typeof content === 'string') {
            console.log(content.split('\n').slice(0, 10).join('\n'));
          }
        } else {
          console.log(`❌ Archivo M3U8 no disponible: ${hlsResponse.status}`);
        }

        // Detener stream
        console.log('\n🛑 Deteniendo stream...');
        const stopResponse = await testEndpoint(`${SERVER_URL}/api/stream/preview/${camera.id}`, 'DELETE');
        if (stopResponse.status === 200) {
          console.log('✅ Stream detenido correctamente');
        } else {
          console.log(`❌ Error al detener stream: ${stopResponse.status}`);
        }
      }
    }

    console.log('\n🎉 Pruebas completadas!');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
    process.exit(1);
  }
}

// Ejecutar pruebas
runTests();