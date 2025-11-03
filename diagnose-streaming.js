#!/usr/bin/env node

/**
 * Script de diagnóstico completo para el streaming RTSP
 */

const http = require('http');

const SERVER_URL = 'http://127.0.0.1:3001';

async function testEndpoint(url, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
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
          resolve({ status: res.statusCode, data: jsonData, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, raw: data });
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

async function runDiagnostics() {
  console.log('🔍 Iniciando diagnóstico completo del sistema RTSP...\n');

  try {
    // 1. Verificar servidor
    console.log('1️⃣ Verificando servidor...');
    const healthCheck = await testEndpoint(`${SERVER_URL}/api/health`);
    if (healthCheck.status !== 200) {
      throw new Error(`❌ Servidor no responde: ${healthCheck.status}`);
    }
    console.log('✅ Servidor funcionando\n');

    // 2. Verificar cámaras
    console.log('2️⃣ Verificando cámaras configuradas...');
    const camerasResponse = await testEndpoint(`${SERVER_URL}/api/rtsp/cameras`);
    if (camerasResponse.status !== 200) {
      throw new Error(`❌ Error obteniendo cámaras: ${camerasResponse.status}`);
    }

    const cameras = camerasResponse.data.cameras || [];
    console.log(`📹 Encontradas ${cameras.length} cámaras`);

    if (cameras.length === 0) {
      console.log('⚠️ No hay cámaras configuradas. Creando una de prueba...');

      const testCamera = {
        name: 'Cámara de Diagnóstico',
        ip: '127.0.0.1',
        port: 554,
        username: '',
        password: '',
        path: '/test',
        protocol: 'rtsp'
      };

      const createResponse = await testEndpoint(`${SERVER_URL}/api/rtsp/cameras`, 'POST', testCamera);
      if (createResponse.status === 201) {
        cameras.push(createResponse.data.camera);
        console.log('✅ Cámara de prueba creada');
      } else {
        console.log('❌ No se pudo crear cámara de prueba');
        return;
      }
    }

    // 3. Probar iniciar stream
    const camera = cameras[0];
    console.log(`\n3️⃣ Probando iniciar stream para: ${camera.name} (${camera.ip}:${camera.port})`);

    const startResponse = await testEndpoint(`${SERVER_URL}/api/stream/preview/${camera.id}`, 'POST');
    if (startResponse.status !== 201 && startResponse.status !== 200) {
      console.log(`❌ Error iniciando stream: ${startResponse.status}`);
      console.log('Respuesta:', startResponse.data);
      return;
    }

    console.log('✅ Stream iniciado exitosamente');
    console.log('HLS URL:', startResponse.data.hlsUrl);

    // 4. Esperar a que ffmpeg genere archivos
    console.log('\n⏳ Esperando 8 segundos para que ffmpeg genere archivos...');
    await new Promise(resolve => setTimeout(resolve, 8000));

    // 5. Verificar playlist HLS
    console.log('\n4️⃣ Verificando playlist HLS...');
    const hlsResponse = await testEndpoint(`${SERVER_URL}/api/stream/hls/${camera.id}`);
    if (hlsResponse.status !== 200) {
      console.log(`❌ Playlist HLS no disponible: ${hlsResponse.status}`);
      console.log('Respuesta:', hlsResponse.data);
    } else {
      console.log('✅ Playlist HLS disponible');
      console.log('Contenido del playlist:');
      console.log(hlsResponse.raw);

      // 6. Verificar segmentos
      const lines = hlsResponse.raw.split('\n');
      const segmentLines = lines.filter(line => line.endsWith('.ts'));

      if (segmentLines.length > 0) {
        console.log('\n5️⃣ Verificando segmentos HLS...');
        for (const segmentLine of segmentLines.slice(0, 2)) { // Probar solo los primeros 2
          const segmentMatch = segmentLine.match(/camera_(\d+)_(\d+)\.ts/);
          if (segmentMatch) {
            const segmentUrl = `${SERVER_URL}/api/stream/segment/${camera.id}/${segmentMatch[2]}.ts`;
            console.log(`Verificando segmento: ${segmentUrl}`);

            try {
              const segmentResponse = await testEndpoint(segmentUrl, 'HEAD');
              if (segmentResponse.status === 200) {
                console.log('✅ Segmento disponible');
              } else {
                console.log(`❌ Segmento no disponible: ${segmentResponse.status}`);
              }
            } catch (err) {
              console.log(`❌ Error accediendo al segmento: ${err.message}`);
            }
          }
        }
      }
    }

    // 7. Verificar estado del stream
    console.log('\n6️⃣ Verificando estado del stream...');
    const statusResponse = await testEndpoint(`${SERVER_URL}/api/stream/status/${camera.id}`);
    if (statusResponse.status === 200) {
      console.log('✅ Estado del stream obtenido');
      console.log('Estado:', statusResponse.data.status);
    } else {
      console.log(`❌ Error obteniendo estado: ${statusResponse.status}`);
    }

    // 8. Detener stream
    console.log('\n7️⃣ Deteniendo stream...');
    const stopResponse = await testEndpoint(`${SERVER_URL}/api/stream/preview/${camera.id}`, 'DELETE');
    if (stopResponse.status === 200) {
      console.log('✅ Stream detenido correctamente');
    } else {
      console.log(`❌ Error deteniendo stream: ${stopResponse.status}`);
    }

    console.log('\n🎉 Diagnóstico completado!');

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error.message);
    process.exit(1);
  }
}

// Ejecutar diagnóstico
runDiagnostics();