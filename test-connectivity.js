#!/usr/bin/env node

/**
 * Script para probar la conectividad cliente-servidor
 */

const http = require('http');

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

async function testConnectivity() {
  console.log('🔗 Probando conectividad cliente-servidor...\n');

  try {
    // Probar servidor directo
    console.log('1️⃣ Probando servidor directo (puerto 3001)...');
    const directResponse = await testEndpoint('http://127.0.0.1:3001/api/health');
    if (directResponse.status === 200) {
      console.log('✅ Servidor directo accesible');
    } else {
      console.log(`❌ Servidor directo no accesible: ${directResponse.status}`);
    }

    // Probar proxy del cliente (puerto 5173)
    console.log('\n2️⃣ Probando proxy del cliente (puerto 5173)...');
    try {
      const proxyResponse = await testEndpoint('http://127.0.0.1:5173/api/health');
      if (proxyResponse.status === 200) {
        console.log('✅ Proxy del cliente funcionando');
      } else {
        console.log(`❌ Proxy del cliente no responde: ${proxyResponse.status}`);
        console.log('💡 Asegúrate de que el cliente esté corriendo: npm run dev');
      }
    } catch (err) {
      console.log(`❌ Error conectando al proxy: ${err.message}`);
      console.log('💡 El cliente no está corriendo. Ejecuta: cd client-configurator && npm run dev');
    }

    // Probar HLS a través del proxy
    console.log('\n3️⃣ Probando acceso HLS a través del proxy...');
    try {
      const hlsResponse = await testEndpoint('http://127.0.0.1:5173/hls/test.txt');
      console.log(`Respuesta HLS proxy: ${hlsResponse.status}`);
    } catch (err) {
      console.log(`❌ Error accediendo a HLS: ${err.message}`);
    }

    console.log('\n📋 Resumen:');
    console.log('- Servidor backend: http://127.0.0.1:3001');
    console.log('- Cliente frontend: http://127.0.0.1:5173');
    console.log('- API a través de proxy: http://127.0.0.1:5173/api/*');
    console.log('- HLS a través de proxy: http://127.0.0.1:5173/hls/*');

  } catch (error) {
    console.error('❌ Error en pruebas de conectividad:', error.message);
  }
}

testConnectivity();