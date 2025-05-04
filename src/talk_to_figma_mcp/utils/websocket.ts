import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";
import { logger } from "./logger";
import { serverUrl, defaultPort, WS_URL, reconnectInterval } from "../config/config";
import { FigmaCommand, FigmaResponse, CommandProgressUpdate, PendingRequest, ProgressMessage } from "../types";

// WebSocket connection and request tracking
let ws: WebSocket | null = null;
let currentChannel: string | null = null;

// Mapa de solicitudes pendientes para seguimiento de promesas
const pendingRequests = new Map<string, PendingRequest>();

/**
 * Conecta con el servidor de Figma mediante WebSocket.
 * @param port - Puerto opcional para la conexión (por defecto usa defaultPort de config)
 */
export function connectToFigma(port: number = defaultPort) {
  // If already connected, do nothing
  if (ws && ws.readyState === WebSocket.OPEN) {
    logger.info('Already connected to Figma');
    return;
  }

  // If connection is in progress (CONNECTING state), wait
  if (ws && ws.readyState === WebSocket.CONNECTING) {
    logger.info('Connection to Figma is already in progress');
    return;
  }

  // If there's an existing socket in a closing state, clean it up
  if (ws && (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED)) {
    ws.removeAllListeners();
    ws = null;
  }

  const wsUrl = serverUrl === 'localhost' ? `${WS_URL}:${port}` : WS_URL;
  logger.info(`Connecting to Figma socket server at ${wsUrl}...`);
  
  try {
    ws = new WebSocket(wsUrl);
    
    // Add connection timeout
    const connectionTimeout = setTimeout(() => {
      if (ws && ws.readyState === WebSocket.CONNECTING) {
        logger.error('Connection to Figma timed out');
        ws.terminate();
      }
    }, 10000); // 10 second connection timeout
    
    ws.on('open', () => {
      clearTimeout(connectionTimeout);
      logger.info('Connected to Figma socket server');
      // Reset channel on new connection
      currentChannel = null;
    });

    ws.on("message", (data: any) => {
      try {
        const json = JSON.parse(data) as ProgressMessage;

        // Handle progress updates
        if (json.type === 'progress_update') {
          const progressData = json.message.data as CommandProgressUpdate;
          const requestId = json.id || '';

          if (requestId && pendingRequests.has(requestId)) {
            const request = pendingRequests.get(requestId)!;

            // Update last activity timestamp
            request.lastActivity = Date.now();

            // Reset the timeout to prevent timeouts during long-running operations
            clearTimeout(request.timeout);

            // Create a new timeout
            request.timeout = setTimeout(() => {
              if (pendingRequests.has(requestId)) {
                logger.error(`Request ${requestId} timed out after extended period of inactivity`);
                pendingRequests.delete(requestId);
                request.reject(new Error('Request to Figma timed out'));
              }
            }, 60000); // 60 second timeout for inactivity

            // Log progress
            logger.info(`Progress update for ${progressData.commandType}: ${progressData.progress}% - ${progressData.message}`);

            // For completed updates, we could resolve the request early if desired
            if (progressData.status === 'completed' && progressData.progress === 100) {
              // Optionally resolve early with partial data
              // request.resolve(progressData.payload);
              // pendingRequests.delete(requestId);

              // Instead, just log the completion, wait for final result from Figma
              logger.info(`Operation ${progressData.commandType} completed, waiting for final result`);
            }
          }
          return;
        }

        // Handle regular responses
        const myResponse = json.message;
        logger.debug(`Received message: ${JSON.stringify(myResponse)}`);
        logger.log('myResponse' + JSON.stringify(myResponse));

        // Handle response to a request
        if (
          myResponse.id &&
          pendingRequests.has(myResponse.id) &&
          myResponse.result
        ) {
          const request = pendingRequests.get(myResponse.id)!;
          clearTimeout(request.timeout);

          if (myResponse.error) {
            logger.error(`Error from Figma: ${myResponse.error}`);
            request.reject(new Error(myResponse.error));
          } else {
            if (myResponse.result) {
              request.resolve(myResponse.result);
            }
          }

          pendingRequests.delete(myResponse.id);
        } else {
          // Handle broadcast messages or events
          logger.info(`Received broadcast message: ${JSON.stringify(myResponse)}`);
        }
      } catch (error) {
        logger.error(`Error parsing message: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    ws.on('error', (error) => {
      logger.error(`Socket error: ${error}`);
      // Don't attempt to reconnect here, let the close handler do it
    });

    ws.on('close', (code, reason) => {
      clearTimeout(connectionTimeout);
      logger.info(`Disconnected from Figma socket server with code ${code} and reason: ${reason || 'No reason provided'}`);
      ws = null;

      // Reject all pending requests
      for (const [id, request] of pendingRequests.entries()) {
        clearTimeout(request.timeout);
        request.reject(new Error(`Connection closed with code ${code}: ${reason || 'No reason provided'}`));
        pendingRequests.delete(id);
      }

      // Attempt to reconnect with exponential backoff
      const backoff = Math.min(30000, reconnectInterval * Math.pow(1.5, Math.floor(Math.random() * 5))); // Max 30s
      logger.info(`Attempting to reconnect in ${backoff/1000} seconds...`);
      setTimeout(() => connectToFigma(port), backoff);
    });
    
  } catch (error) {
    logger.error(`Failed to create WebSocket connection: ${error instanceof Error ? error.message : String(error)}`);
    // Attempt to reconnect after a delay
    setTimeout(() => connectToFigma(port), reconnectInterval);
  }
}

/**
 * Unirse a un canal específico en Figma.
 * @param channelName - Nombre del canal al que unirse
 * @returns Promesa que se resuelve cuando se ha unido al canal
 */
export async function joinChannel(channelName: string): Promise<void> {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    throw new Error("Not connected to Figma");
  }

  try {
    await sendCommandToFigma("join", { channel: channelName });
    currentChannel = channelName;
    logger.info(`Joined channel: ${channelName}`);
  } catch (error) {
    logger.error(`Failed to join channel: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Obtener el canal actual al que está conectado.
 * @returns El nombre del canal actual o null si no está conectado a ningún canal
 */
export function getCurrentChannel(): string | null {
  return currentChannel;
}

/**
 * Envía un comando a Figma a través de WebSocket.
 * @param command - El comando a enviar
 * @param params - Parámetros adicionales para el comando
 * @param timeoutMs - Tiempo de espera en milisegundos antes de fallar
 * @returns Una promesa que se resuelve con la respuesta de Figma
 */
export function sendCommandToFigma(
  command: FigmaCommand,
  params: unknown = {},
  timeoutMs: number = 30000
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    // If not connected, try to connect first
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      connectToFigma();
      reject(new Error("Not connected to Figma. Attempting to connect..."));
      return;
    }

    // Check if we need a channel for this command
    const requiresChannel = command !== "join";
    if (requiresChannel && !currentChannel) {
      reject(new Error("Must join a channel before sending commands"));
      return;
    }

    const id = uuidv4();
    const request = {
      id,
      type: command === "join" ? "join" : "message",
      ...(command === "join"
        ? { channel: (params as any).channel }
        : { channel: currentChannel }),
      message: {
        id,
        command,
        params: {
          ...(params as any),
          commandId: id, // Include the command ID in params
        },
      },
    };

    // Set timeout for request
    const timeout = setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        logger.error(`Request ${id} to Figma timed out after ${timeoutMs / 1000} seconds`);
        reject(new Error('Request to Figma timed out'));
      }
    }, timeoutMs);

    // Store the promise callbacks to resolve/reject later
    pendingRequests.set(id, {
      resolve,
      reject,
      timeout,
      lastActivity: Date.now()
    });

    // Send the request
    logger.info(`Sending command to Figma: ${command}`);
    logger.debug(`Request details: ${JSON.stringify(request)}`);
    ws.send(JSON.stringify(request));
  });
}