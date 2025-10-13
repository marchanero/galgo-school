# Problema MQTT - Análisis y Solución

## 🔍 Diagnóstico del Problema

El broker EMQX en `100.107.238.60:1883` está **cerrando inmediatamente las conexiones** después de que el cliente se conecta exitosamente. Este comportamiento indica un problema de configuración en el servidor MQTT, no en el cliente.

### Evidencia:
1. ✅ La conexión inicial se establece correctamente
2. ✅ Las credenciales (admin/galgo2526) son aceptadas
3. ❌ El broker cierra la conexión inmediatamente después
4. 🔄 El cliente intenta reconectar continuamente

## 🛠️ Posibles Causas en el Broker EMQX

### 1. **Límite de Conexiones por Cliente**
El broker puede tener configurado un límite muy bajo de tiempo de vida para las conexiones.

**Solución en EMQX Dashboard:**
```
Authentication & ACL → Settings → Connection
- Max Keep Alive: aumentar a 300 segundos
- Force GC Count: aumentar valor
```

### 2. **ACL (Access Control List) Restrictivo**
Las reglas de acceso pueden estar bloqueando la conexión después del handshake.

**Verificar en EMQX:**
```bash
# Revisar logs de EMQX
tail -f /var/log/emqx/emqx.log

# Buscar mensajes como:
# "Client [clientId] disconnected due to ACL deny"
```

**Solución:**
- Dashboard EMQX → Access Control → ACL
- Asegurar que el usuario 'admin' tenga permisos `allow` para:
  - pub: `galgo/#`, `test/#`
  - sub: `galgo/#`, `test/#`

### 3. **Rate Limiting**
El broker puede estar limitando conexiones muy rápidas.

**Verificar:**
```
Listeners → tcp:default → Max Conn Rate
Listeners → tcp:default → Max Connections
```

### 4. **Session Expiry**
El intervalo de expiración de sesión puede ser muy corto.

**Configuración recomendada:**
```
mqtt.session.expiry_interval = 7200s
```

## ✅ Cambios Implementados en el Cliente (API)

### 1. **Client ID Aleatorio**
```javascript
clientId: `galgo-api-${Math.random().toString(16).slice(2, 10)}`
```
Evita conflictos si hay múltiples instancias.

### 2. **Configuración Optimizada**
```javascript
{
  clean: true,                  // Sesión limpia
  keepalive: 60,               // Ping cada 60 segundos
  reconnectPeriod: 5000,       // Espera 5s entre reconexiones
  reschedulePings: false,      // No reprogramar pings
  protocolVersion: 4,          // MQTT 3.1.1
}
```

### 3. **Manejo de Eventos Mejorado**
- Logs detallados de conexión/desconexión
- Retraso antes de suscribirse a topics
- Sin publicación inmediata al conectar

## 🔧 Pasos para Resolver en EMQX

### Opción 1: EMQX Dashboard (Web)

1. Acceder al dashboard: `http://100.107.238.60:18083`
2. Usuario: `admin`, Contraseña: (usar la del dashboard)

3. **Verificar configuración del listener:**
   ```
   Management → Listeners → tcp:default
   - Max Connections: aumentar si es bajo
   - Rate: aumentar límite de conexiones/segundo
   ```

4. **Revisar autenticación:**
   ```
   Authentication → Authentication
   - Verificar que 'admin' esté activo
   - Probar credenciales
   ```

5. **Revisar ACL:**
   ```
   Access Control → Authorization
   - Agregar regla: {username: "admin", action: "all", permission: "allow"}
   ```

6. **Configuración de MQTT:**
   ```
   Management → MQTT Settings
   - Max Packet Size: 1MB
   - Max QoS Allowed: 2
   - Max Topic Levels: 10
   - Session Expiry Interval: 7200s
   ```

### Opción 2: Archivo de Configuración

Editar `/etc/emqx/emqx.conf`:

```conf
## Aumentar keepalive
mqtt.max_keepalive = 300

## Aumentar timeout de conexión
mqtt.conn_congestion.alarm_timeout = 30s

## Session settings
mqtt.session.expiry_interval = 2h
mqtt.session.max_inflight = 32
mqtt.session.max_awaiting_rel = 100

## Retry settings
mqtt.retry_interval = 30s

## Max packet size
mqtt.max_packet_size = 1MB
```

Reiniciar EMQX:
```bash
sudo systemctl restart emqx
```

### Opción 3: Comandos CLI de EMQX

```bash
# Ver clientes conectados
emqx ctl clients list

# Ver información de un cliente específico
emqx ctl clients show <clientid>

# Ver logs en tiempo real
emqx ctl log primary-level debug

# Verificar ACL
emqx ctl acl reload
```

## 🧪 Scripts de Prueba

### Prueba Básica
```bash
cd server
node test-mqtt.js
```

### Diagnóstico Detallado (60 segundos)
```bash
cd server
node diagnose-mqtt.js
```

## 📊 Indicadores de Éxito

✅ **Conexión Estable:**
- El script de diagnóstico debe mostrar: `Connection stable (Xs)`
- Sin mensajes de "offline" o "disconnected"
- Mensajes recibidos correctamente

✅ **API Funcionando:**
- Logs muestran solo: `✅ Connected to MQTT broker`
- Sin ciclos de reconexión
- Endpoint `/api/health` muestra `mqtt.connected: true`

## 🆘 Si el Problema Persiste

1. **Verificar firewall:**
   ```bash
   sudo iptables -L | grep 1883
   ```

2. **Verificar que EMQX esté escuchando:**
   ```bash
   sudo netstat -tlnp | grep 1883
   ```

3. **Revisar logs de EMQX:**
   ```bash
   tail -f /var/log/emqx/emqx.log
   ```

4. **Probar con mosquitto_sub/pub:**
   ```bash
   mosquitto_pub -h 100.107.238.60 -p 1883 -u admin -P galgo2526 -t test/topic -m "Hello"
   mosquitto_sub -h 100.107.238.60 -p 1883 -u admin -P galgo2526 -t test/#
   ```

## 📞 Contacto con el Administrador del Broker

Si tienes acceso al servidor donde corre EMQX, solicita al administrador:

1. Revisar logs del broker durante las conexiones
2. Verificar configuración de ACL y autenticación
3. Aumentar límites de conexión y keepalive
4. Desactivar rate limiting temporalmente para pruebas

---

**Última actualización:** 13 de octubre de 2025
**Estado:** El cliente está optimizado, el problema está en la configuración del broker EMQX.
