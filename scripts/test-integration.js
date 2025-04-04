#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import { createServer } from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[✓]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  step: (msg) => console.log(`\n${colors.cyan}${colors.bold}[PASO]${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.magenta}${colors.bold}== ${msg} ==${colors.reset}\n`)
};

// Función para crear una interfaz de lectura para entrada del usuario
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

// Función para preguntar al usuario
async function askQuestion(question) {
  const rl = createInterface();
  return new Promise(resolve => {
    rl.question(`${colors.yellow}? ${question}${colors.reset} `, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

// Verificar si el puerto está en uso
function isPortInUse(port) {
  try {
    const server = createServer();
    return new Promise((resolve) => {
      server.once('error', err => {
        if (err.code === 'EADDRINUSE') {
          resolve(true);
        } else {
          resolve(false);
        }
      });
      
      server.once('listening', () => {
        server.close();
        resolve(false);
      });
      
      server.listen(port);
    });
  } catch (err) {
    log.error(`Error al verificar el puerto ${port}: ${err.message}`);
    return Promise.resolve(true); // Asumimos que está en uso si hay un error
  }
}

// Verificar dependencias
async function checkDependencies() {
  log.step('Verificando dependencias instaladas');
  
  try {
    log.info('Verificando Bun...');
    execSync('bun --version', { stdio: 'pipe' });
    log.success('Bun está instalado');
  } catch (err) {
    log.error('Bun no está instalado. Por favor, instálalo desde https://bun.sh');
    process.exit(1);
  }

  // Verificar MCP SDK
  try {
    log.info('Verificando @modelcontextprotocol/sdk...');
    const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
    if (packageJson.dependencies['@modelcontextprotocol/sdk']) {
      log.success('MCP SDK está incluido en el package.json');
    } else {
      log.error('MCP SDK no está incluido en el package.json');
      process.exit(1);
    }
  } catch (err) {
    log.error(`No se pudo leer package.json: ${err.message}`);
    process.exit(1);
  }
}

// Verificar configuración de Claude Desktop
async function checkClaudeConfig() {
  log.step('Verificando configuración de Claude Desktop');

  const configPath = process.platform === 'darwin' 
    ? path.join(process.env.HOME, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')
    : path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');

  log.info(`Buscando archivo de configuración en: ${configPath}`);
  
  try {
    if (!fs.existsSync(configPath)) {
      log.warning('Archivo de configuración de Claude Desktop no encontrado');
      const shouldConfigure = await askQuestion('¿Deseas configurar Claude Desktop ahora? (s/n)');
      
      if (shouldConfigure.toLowerCase() === 's') {
        log.info('Ejecutando script de configuración...');
        execSync('bun run configure-claude', { stdio: 'inherit', cwd: rootDir });
        log.success('Configuración completada');
      } else {
        log.warning('Configuración omitida. El MCP puede no funcionar correctamente');
      }
      return;
    }
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (config.mcpServers && config.mcpServers['ClaudeTalkToFigma']) {
      log.success('Configuración de ClaudeTalkToFigma encontrada en Claude Desktop');
    } else {
      log.warning('ClaudeTalkToFigma no está configurado en Claude Desktop');
      const shouldConfigure = await askQuestion('¿Deseas configurar Claude Desktop ahora? (s/n)');
      
      if (shouldConfigure.toLowerCase() === 's') {
        log.info('Ejecutando script de configuración...');
        execSync('bun run configure-claude', { stdio: 'inherit', cwd: rootDir });
        log.success('Configuración completada');
      } else {
        log.warning('Configuración omitida. El MCP puede no funcionar correctamente');
      }
    }
  } catch (err) {
    log.error(`Error al verificar configuración: ${err.message}`);
  }
}

// Iniciar servidor WebSocket
async function startWebSocketServer() {
  log.step('Iniciando servidor WebSocket');
  
  // Verificar si el puerto 3055 está en uso
  const portInUse = await isPortInUse(3055);
  if (portInUse) {
    log.warning('El puerto 3055 ya está en uso. Posiblemente el servidor WebSocket ya está ejecutándose.');
    const shouldContinue = await askQuestion('¿Deseas continuar con las pruebas? (s/n)');
    if (shouldContinue.toLowerCase() !== 's') {
      log.info('Pruebas canceladas. Libera el puerto 3055 e intenta nuevamente.');
      process.exit(0);
    }
    
    log.info('Continuando pruebas con el servidor WebSocket actual');
    return null;
  }
  
  log.info('Iniciando servidor WebSocket en puerto 3055...');
  const wsServer = spawn('bun', ['run', 'src/socket.ts'], { 
    cwd: rootDir,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  wsServer.stdout.on('data', (data) => {
    const message = data.toString().trim();
    if (message.includes('WebSocket server running')) {
      log.success('Servidor WebSocket iniciado correctamente');
    }
    console.log(`${colors.cyan}[WebSocket]${colors.reset} ${message}`);
  });
  
  wsServer.stderr.on('data', (data) => {
    console.error(`${colors.red}[WebSocket Error]${colors.reset} ${data.toString().trim()}`);
  });
  
  // Esperar a que el servidor inicie
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return wsServer;
}

// Verificar estado del servidor WebSocket
async function checkWebSocketStatus() {
  log.step('Verificando estado del servidor WebSocket');
  
  try {
    log.info('Consultando endpoint de estado...');
    
    // Realizar petición HTTP al endpoint de estado
    const fetchStatus = async () => {
      try {
        const response = await fetch('http://localhost:3055/status');
        if (!response.ok) {
          throw new Error(`Respuesta inesperada: ${response.status} ${response.statusText}`);
        }
        return await response.json();
      } catch (err) {
        throw err;
      }
    };
    
    // Intentar hasta 3 veces con espera de 1 segundo entre intentos
    let status = null;
    let tries = 0;
    while (tries < 3) {
      try {
        status = await fetchStatus();
        break;
      } catch (err) {
        tries++;
        if (tries < 3) {
          log.warning(`Intento ${tries} fallido: ${err.message}`);
          await new Promise(r => setTimeout(r, 1000));
        } else {
          throw err;
        }
      }
    }
    
    if (status) {
      log.success('Servidor WebSocket está ejecutándose');
      log.info(`Estadísticas: ${JSON.stringify(status.stats)}`);
      return true;
    }
  } catch (err) {
    log.error(`No se pudo verificar el estado del servidor: ${err.message}`);
    return false;
  }
}

// Verificar plugin de Figma
async function checkFigmaPlugin() {
  log.step('Verificando plugin de Figma');
  
  const pluginPath = path.join(rootDir, 'src', 'claude_mcp_plugin');
  
  try {
    log.info(`Verificando directorio del plugin: ${pluginPath}`);
    
    if (!fs.existsSync(pluginPath)) {
      log.error('Directorio del plugin no encontrado');
      return false;
    }
    
    const manifestPath = path.join(pluginPath, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      log.error('Archivo manifest.json no encontrado');
      return false;
    }
    
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    log.success(`Plugin '${manifest.name}' (ID: ${manifest.id}) encontrado`);
    
    // Verificar archivos del plugin
    const requiredFiles = ['manifest.json', 'code.js', 'ui.html'];
    for (const file of requiredFiles) {
      const filePath = path.join(pluginPath, file);
      if (!fs.existsSync(filePath)) {
        log.error(`Archivo ${file} no encontrado`);
        return false;
      }
    }
    
    log.success('Todos los archivos del plugin están presentes');
    log.info('\nPara instalar el plugin en Figma:');
    log.info('1. Abre Figma');
    log.info('2. Ve a Plugins > Development > New Plugin');
    log.info('3. Haz clic en "Link existing plugin"');
    log.info(`4. Selecciona el archivo: ${manifestPath}`);
    
    // Preguntar si el usuario ya ha instalado el plugin
    const isPluginInstalled = await askQuestion('¿Has instalado el plugin en Figma? (s/n)');
    if (isPluginInstalled.toLowerCase() !== 's') {
      log.warning('Por favor, instala el plugin antes de continuar con las pruebas');
    } else {
      log.success('Plugin instalado según el usuario');
    }
    
    return true;
  } catch (err) {
    log.error(`Error al verificar plugin: ${err.message}`);
    return false;
  }
}

// Realizar pruebas de integración
async function runIntegrationTests() {
  log.title('PRUEBAS DE INTEGRACIÓN CLAUDE-FIGMA');
  
  // Verificar dependencias
  await checkDependencies();
  
  // Verificar configuración de Claude
  await checkClaudeConfig();
  
  // Iniciar y verificar servidor WebSocket
  const wsServer = await startWebSocketServer();
  const serverStatus = await checkWebSocketStatus();
  
  if (!serverStatus) {
    log.error('No se pudo verificar el servidor WebSocket. Abortando pruebas.');
    if (wsServer) wsServer.kill();
    process.exit(1);
  }
  
  // Verificar plugin de Figma
  await checkFigmaPlugin();
  
  // Instrucciones para pruebas manuales
  log.step('Realizando pruebas manuales de integración');
  
  log.info('\nPara completar las pruebas de integración, sigue estos pasos:');
  log.info('1. Abre Claude Desktop');
  log.info('2. Selecciona "ClaudeTalkToFigma" en el selector de MCPs');
  log.info('3. Abre Figma y ejecuta el plugin');
  log.info('4. En el plugin, conéctate al servidor WebSocket (puerto 3055)');
  log.info('5. Prueba estos comandos en Claude:');
  log.info('   - "Conéctate a Figma usando el canal default"');
  log.info('   - "Obtén información sobre el documento actual"');
  log.info('   - "Obtén información sobre la selección actual"');
  
  log.title('PRUEBAS COMPLETADAS');
  log.info('El script de pruebas ha completado todas las verificaciones automatizadas.');
  log.info('Por favor, continúa con las pruebas manuales según las instrucciones anteriores.');
  
  // Preguntar si desea mantener el servidor WebSocket ejecutándose
  if (wsServer) {
    const keepServerRunning = await askQuestion('¿Deseas mantener el servidor WebSocket ejecutándose? (s/n)');
    if (keepServerRunning.toLowerCase() !== 's') {
      log.info('Deteniendo servidor WebSocket...');
      wsServer.kill();
      log.success('Servidor WebSocket detenido');
    } else {
      log.info('El servidor WebSocket continuará ejecutándose en segundo plano.');
      log.info('Para detenerlo, presiona Ctrl+C en la terminal o utiliza el administrador de tareas.');
      // Desconectar proceso del terminal para que siga ejecutándose
      wsServer.unref();
    }
  }
}

// Ejecutar pruebas
runIntegrationTests().catch(err => {
  log.error(`Error durante las pruebas: ${err.message}`);
  process.exit(1);
}); 