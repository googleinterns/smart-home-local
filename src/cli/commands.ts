import {UDPScanConfig} from '../radio/radio-hub';
type CommandType = 'SCAN' | 'IDENTIFY' | 'EXECUTE';

/**
 * A flag for the worker thread to indicate it's ready to recieve messages.
 */
export const READY_FOR_MESSAGE = 'READY_FOR_MESSAGE';
export const CHECK_READY = 'CHECK_READY';

export interface CommandMessage {
  commandType: CommandType;
}

/**
 * A class containing all parameters needed to process an Identify command.
 */
export class IdentifyMessage implements CommandMessage {
  commandType: CommandType = 'IDENTIFY';
  requestId: string;
  discoveryBuffer: string;
  deviceId: string;
  /**
   * @param requestId  The request id for a triggered Identify request.
   * @param discoveryBuffer  The discovery buffer to send in a triggered Identify request.
   * @param deviceId workerMessageType The device id for a triggered Identify request.
   * @returns  A new IntentMessage instance.
   */
  constructor(requestId: string, discoveryBuffer: string, deviceId: string) {
    this.requestId = requestId;
    this.discoveryBuffer = discoveryBuffer;
    this.deviceId = deviceId;
  }
}

/**
 * A class containing all parameters needed to process an Identify command.
 */
export class ExecuteMessage implements CommandMessage {
  commandType: CommandType = 'EXECUTE';
  requestId: string;
  localDeviceId: string;
  executeCommand: string;
  params: Record<string, unknown>;
  customData: Record<string, unknown>;

  /**
   * @param requestId  The request id for a triggered Execute request.
   * @param localDeviceId  The localDeviceId for a triggered Execute request.
   * @param executeCommand  The single command string to set in the triggered Execute request.
   * @param params  The params array for the single Execute command.
   * @param customData  The customData array for the single Execute command.
   * @returns  A new ExecuteCommand instance.
   */
  constructor(
    requestId: string,
    localDeviceId: string,
    executeCommand: string,
    params: Record<string, unknown>,
    customData: Record<string, unknown>
  ) {
    this.requestId = requestId;
    this.localDeviceId = localDeviceId;
    this.executeCommand = executeCommand;
    this.params = params;
    this.customData = customData;
  }
}

export class ScanMessage {
  commandType: CommandType = 'SCAN';
  deviceId: string;
  requestId: string;
  scanConfig: UDPScanConfig;
  constructor(deviceId: string, requestId: string, scanConfig: UDPScanConfig) {
    this.deviceId = deviceId;
    this.requestId = requestId;
    this.scanConfig = scanConfig;
  }
}
