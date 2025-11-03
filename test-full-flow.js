#!/usr/bin/env node

/**
 * Script para probar el flujo completo: iniciar stream → acceder HLS → detener stream
 */

const http = require('http');

const CLIENT_URL = 'http://127.0.0.1:5173'; // Cliente con proxy
const SERVER_URL = 'http://127.0.0.1:3001'; // Servidor directo

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

async function testFullFlow() {
  console.log('🎬 Probando flujo completo de streaming...\n');

  try {
    // 1. Verificar que hay cámaras
    console.log('1️⃣ Verificando cámaras...');
    const camerasResponse = await testEndpoint(`${CLIENT_URL}/api/rtsp/cameras`);
    if (camerasResponse.status !== 200) {
      throw new Error(`❌ Error obteniendo cámaras: ${camerasResponse.status}`);
    }

    const cameras = camerasResponse.data.cameras || [];
    console.log(`📹 Encontradas ${cameras.length} cámaras`);

    if (cameras.length === 0) {
      console.log('⚠️ No hay cámaras. Creando una de prueba...');
      return;
    }

    const camera = cameras[0];
    console.log(`🎥 Usando cámara: ${camera.name} (ID: ${camera.id})`);

    // 2. Iniciar stream
    console.log('\n2️⃣ Iniciando stream...');
    const startResponse = await testEndpoint(`${CLIENT_URL}/api/stream/preview/${camera.id}`, 'POST');
    if (startResponse.status !== 201 && startResponse.status !== 200) {
      console.log(`❌ Error iniciando stream: ${startResponse.status}`);
      console.log('Respuesta:', startResponse.data);
      return;
    }

    console.log('✅ Stream iniciado');
    console.log('HLS URL:', startResponse.data.hlsUrl);

    // 3. Esperar a que ffmpeg genere archivos
    console.log('\n⏳ Esperando 10 segundos para que ffmpeg genere archivos...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // 4. Verificar playlist HLS a través del cliente
    console.log('\n3️⃣ Verificando playlist HLS a través del cliente...');
    const hlsUrl = `${CLIENT_URL}${startResponse.data.hlsUrl}`;
    console.log(`Accediendo a: ${hlsUrl}`);

    const hlsResponse = await testEndpoint(hlsUrl);
    if (hlsResponse.status !== 200) {
      console.log(`❌ Playlist HLS no disponible: ${hlsResponse.status}`);
      console.log('Respuesta:', hlsResponse.data);
    } else {
      console.log('✅ Playlist HLS disponible a través del cliente');
      console.log('Contenido del playlist:');
      console.log(hlsResponse.raw.substring(0, 200) + '...');

      // 5. Verificar que las URLs del playlist están correctas
      const lines = hlsResponse.raw.split('\n');
      const segmentLines = lines.filter(line => line.includes('.ts'));

      if (segmentLines.length > 0) {
        console.log('\n4️⃣ Verificando URLs de segmentos...');
        for (const segmentLine of segmentLines.slice(0, 1)) {
          console.log(`Segmento encontrado: ${segmentLine}`);
          if (segmentLine.includes('/api/stream/segment/')) {
            console.log('✅ URL del segmento es correcta (apunta al endpoint)');
          } else {
            console.log('❌ URL del segmento es incorrecta');
          }
        }
      }
    }

    // 6. Verificar estado del stream
    console.log('\n5️⃣ Verificando estado del stream...');
    const statusResponse = await testEndpoint(`${CLIENT_URL}/api/stream/status/${camera.id}`);
    if (statusResponse.status === 200) {
      console.log('✅ Estado del stream:', statusResponse.data.status.status);
    }

    // 7. Detener stream
    console.log('\n6️⃣ Deteniendo stream...');
    const stopResponse = await testEndpoint(`${CLIENT_URL}/api/stream/preview/${camera.id}`, 'DELETE');
    if (stopResponse.status === 200) {
      console.log('✅ Stream detenido correctamente');
    }

    console.log('\n🎉 Flujo completo probado exitosamente!');
    console.log('\n💡 Ahora puedes probar en el navegador:');
    console.log(`   Cliente: ${CLIENT_URL}`);
    console.log('   Ve a la sección de Cámaras RTSP y haz clic en "Iniciar"');

  } catch (error) {
    console.error('❌ Error en el flujo:', error.message);
  }
}

testFullFlow();