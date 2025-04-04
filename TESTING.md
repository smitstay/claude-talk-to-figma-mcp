# Guía de Pruebas para Claude Talk to Figma MCP

Este documento proporciona una guía detallada para probar la integración entre Claude Desktop y Figma, así como soluciones a problemas comunes.

## Requisitos previos

Antes de comenzar las pruebas, asegúrate de tener:

- Claude Desktop instalado
- Cuenta de Figma con acceso a la creación de plugins
- Bun instalado (v1.0.0 o superior)
- Permisos para instalar plugins en Figma

## Casos de Prueba

### 1. Configuración del entorno

| Caso de prueba | Pasos | Resultado esperado |
| -------------- | ----- | ------------------ |
| Instalación de dependencias | Ejecutar `bun install` | Todas las dependencias se instalan sin errores |
| Configuración de Claude | Ejecutar `bun run configure-claude` | Script ejecutado correctamente, mensaje de configuración exitosa |
| Verificar configuración | Revisar archivo `claude_desktop_config.json` | Contiene la configuración para "ClaudeTalkToFigma" |

### 2. Configuración del servidor WebSocket

| Caso de prueba | Pasos | Resultado esperado |
| -------------- | ----- | ------------------ |
| Iniciar servidor WebSocket | Ejecutar `bun socket` | Servidor inicia en puerto 3055, muestra mensaje de confirmación |
| Verificar estado del servidor | Acceder a `http://localhost:3055/status` | Devuelve JSON con estado "running" y estadísticas |
| Probar reconexión | Detener y volver a iniciar el servidor | Cliente se reconecta automáticamente |

### 3. Instalación del plugin de Figma

| Caso de prueba | Pasos | Resultado esperado |
| -------------- | ----- | ------------------ |
| Importar plugin | Importar `src/claude_mcp_plugin/manifest.json` en Figma | Plugin aparece en menú de desarrollo |
| Ejecutar plugin | Abrir plugin desde Figma | Interfaz de usuario del plugin se muestra correctamente |
| Conexión al servidor | Ingresar puerto 3055 y conectar | Mensaje "Conectado a Claude MCP server" |

### 4. Pruebas de integración Claude-MCP-Figma

| Caso de prueba | Pasos | Resultado esperado |
| -------------- | ----- | ------------------ |
| Obtener info del documento | Preguntar a Claude sobre el documento abierto | Claude devuelve información sobre el documento |
| Obtener selección | Seleccionar elemento en Figma y preguntar a Claude | Claude devuelve detalles del elemento seleccionado |
| Crear elemento | Pedir a Claude que cree un rectángulo | Rectángulo creado en documento de Figma |
| Modificar elemento | Pedir a Claude que cambie color de un elemento | Color del elemento cambiado correctamente |
| Operación compleja | Pedir a Claude que busque texto y lo modifique | Texto modificado correctamente en múltiples nodos |

## Solución de Problemas Comunes

### Problemas de conexión

| Problema | Posible causa | Solución |
| -------- | ------------- | -------- |
| "No se puede conectar al servidor WebSocket" | Servidor no está ejecutándose | Ejecutar `bun socket` en terminal |
| "Error de conexión: puerto en uso" | Puerto 3055 ocupado | Liberar puerto o cambiar configuración de puerto |
| "No se puede conectar desde plugin" | Restricciones de CORS | Verificar que el plugin use el dominio correcto |
| "Conexión rechazada" | Firewall bloqueando conexión | Permitir conexiones al puerto 3055 en firewall |

### Problemas con Claude Desktop

| Problema | Posible causa | Solución |
| -------- | ------------- | -------- |
| "MCP no aparece en Claude Desktop" | Configuración incorrecta | Verificar archivo de configuración y ejecutar `bun run configure-claude` |
| "Claude no responde a comandos de Figma" | MCP no seleccionado | Seleccionar "ClaudeTalkToFigma" en el menú de MCPs |
| "Error al ejecutar comando MCP" | Dependencias faltantes | Reinstalar con `bun install` |
| "Claude no puede ejecutar comandos en Figma" | Canal no unido | Verificar que se ejecutó `join_channel` |

### Problemas con Figma

| Problema | Posible causa | Solución |
| -------- | ------------- | -------- |
| "Plugin no aparece en Figma" | Importación incorrecta | Verificar ruta y reimportar el plugin |
| "Error al ejecutar comandos en Figma" | Permisos insuficientes | Verificar permisos en manifest.json |
| "No se pueden modificar elementos" | Documento en modo solo lectura | Abrir documento en modo edición |
| "Error al crear elementos" | Selección incorrecta | Verificar que la página o frame destino esté seleccionado |

## Diagnóstico y Depuración

### Herramientas de Diagnóstico

1. **Logs del servidor WebSocket**:
   - Los logs detallados se muestran en la terminal donde ejecutas `bun socket`
   - Busca mensajes de tipo ERROR o WARN para identificar problemas

2. **Endpoint de estado**:
   - Accede a `http://localhost:3055/status` para verificar estadísticas
   - Comprueba conexiones activas y errores acumulados

3. **Consola de Figma**:
   - Abre la consola de desarrollo en Figma (F12 o Cmd+Option+I)
   - Revisa mensajes de error relacionados con el plugin

4. **Verificación de configuración**:
   - Examina `claude_desktop_config.json` para confirmar la correcta configuración

### Pasos para Depuración Sistemática

1. **Verificar componentes individuales**:
   - Confirma que el servidor WebSocket está funcionando
   - Verifica que el plugin de Figma puede abrirse
   - Comprueba que Claude Desktop reconoce el MCP

2. **Probar comunicación por partes**:
   - Prueba la conexión del plugin al WebSocket directamente
   - Verifica que Claude puede ejecutar comandos MCP básicos
   - Confirma que los comandos llegan al plugin de Figma

3. **Reiniciar componentes en orden**:
   - Reinicia el servidor WebSocket
   - Recarga el plugin en Figma
   - Reinicia Claude Desktop

4. **Actualizar versiones**:
   - Asegúrate de tener las últimas versiones de todas las dependencias
   - Verifica compatibilidad con la versión actual de Figma

## Lista de Verificación para Pruebas Integrales

- [ ] Configuración de Claude Desktop completada
- [ ] Servidor WebSocket iniciado y funcionando
- [ ] Plugin de Figma instalado y conectado
- [ ] Claude Desktop puede obtener información del documento
- [ ] Claude Desktop puede obtener selección actual
- [ ] Claude Desktop puede crear nuevos elementos
- [ ] Claude Desktop puede modificar elementos existentes
- [ ] Claude Desktop puede escanear y modificar texto
- [ ] El sistema se recupera correctamente de desconexiones
- [ ] Los errores son manejados y reportados adecuadamente 