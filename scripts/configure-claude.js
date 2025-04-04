#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get current file directory (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determinar la ubicación del archivo de configuración de Claude Desktop
const configPath = os.platform() === 'darwin' 
  ? path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')
  : path.join(os.homedir(), 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json');

// Obtener la ruta absoluta de package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const packageName = packageJson.name;
const packageVersion = packageJson.version;

console.log(`Configurando Claude Desktop para ${packageName} v${packageVersion}...`);

// Crear copias de seguridad
function backupFile(filePath) {
  if (fs.existsSync(filePath)) {
    const backupPath = `${filePath}.backup-${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`Backup creado en: ${backupPath}`);
  }
}

// Leer configuración existente o crear nueva
let config = {};
try {
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('Configuración existente encontrada.');
    backupFile(configPath);
  } else {
    console.log('No se encontró configuración existente. Creando nueva.');
    
    // Crear directorios necesarios si no existen
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
      console.log(`Directorio creado: ${configDir}`);
    }
  }
} catch (e) {
  console.error(`Error al leer la configuración existente: ${e.message}`);
  console.error('Creando nueva configuración.');
}

// Verificar si bun está instalado
let useBun = false;
try {
  execSync('bun --version', { stdio: 'ignore' });
  useBun = true;
  console.log('Bun detectado en el sistema.');
} catch (e) {
  console.log('Bun no está instalado. Se usará npx como alternativa.');
}

// Añadir configuración del MCP
config.mcpServers = config.mcpServers || {};
config.mcpServers['ClaudeTalkToFigma'] = {
  command: useBun ? 'bunx' : 'npx',
  args: [`${packageName}@${packageVersion}`]
};

console.log('Configuración actualizada para ClaudeTalkToFigma:');
console.log(JSON.stringify(config.mcpServers['ClaudeTalkToFigma'], null, 2));

// Escribir configuración
try {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`Configuración guardada en ${configPath}`);
  console.log('\nConfiguración completada con éxito.');
  console.log('\nPara utilizar este MCP en Claude Desktop:');
  console.log('1. Reinicia Claude Desktop si está ejecutándose');
  console.log('2. Abre Claude Desktop y selecciona "ClaudeTalkToFigma" en la lista de MCPs');
  console.log('3. Inicia el servidor WebSocket: bun socket');
  console.log('4. Instala y ejecuta el plugin de Figma');
} catch (e) {
  console.error(`Error al escribir la configuración: ${e.message}`);
  console.error(`Asegúrate de tener permisos de escritura en: ${configPath}`);
} 