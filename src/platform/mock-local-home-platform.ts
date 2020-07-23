/*
 * Mock Local Home Platform class
 */
/// <reference types="@google/local-home-sdk" />
import {AppStub} from './smart-home-app';
import {DeviceManagerStub} from './device-manager';

export const ERROR_UNDEFINED_VERIFICATIONID: string =
  'The handler returned an IdentifyResponse with an undefined verificationId';
export const ERROR_UNDEFINED_IDENTIFY_HANDLER: string =
  "Couldn't trigger an IdentifyRequest: The App identifyHandler was undefined.";
export const ERROR_UNDEFINED_EXECUTE_HANDLER: string =
  "Couldn't trigger an ExecuteRequest: The App executeHandler was undefined.";
export const ERROR_NO_LOCAL_DEVICE_ID_FOUND: string =
  'Cannot get localDeviceId of unregistered deviceId';
export const ERROR_DEVICE_ID_NOT_REGISTERED: string =
  'Cannot trigger an ExecuteRequest: The provided deviceId was not registered to the platform';
export const ERROR_EXECUTE_RESPONSE_ERROR_STATUS: string =
  "One or more ExecuteResponseCommands returned with an 'ERROR' status";

export class MockLocalHomePlatform {
  private deviceManager: DeviceManagerStub = new DeviceManagerStub();
  private app: AppStub;
  private localDeviceIds: Map<string, string> = new Map<string, string>();

  /**
   * Constructs a new MockLocalHomePlatform instance using an App instance
   * @param app the AppStub that acts as an interface for intent handlers
   */
  public constructor(app: AppStub) {
    this.app = app;
  }

  public getDeviceManager(): DeviceManagerStub {
    return this.deviceManager;
  }

  public isDeviceIdRegistered(deviceId: string): boolean {
    return this.localDeviceIds.has(deviceId);
  }

  public getLocalDeviceId(deviceId: string): string {
    if (!this.isDeviceIdRegistered(deviceId)) {
      throw new Error(ERROR_NO_LOCAL_DEVICE_ID_FOUND);
    }
    return this.localDeviceIds.get(deviceId)!;
  }

  /**
   * Takes a `discoveryBuffer` and passes it to the fulfillment app in an `IdentifyRequest`
   * @param requestId  The requestId to set on the `IdentifyRequest`
   * @param discoveryBuffer  The buffer to be included in the `IdentifyRequest` scan data
   * @param deviceId  The device ID to link with the localDeviceId returned from fulfillment
   * @returns  The next localDeviceId registered to the Local Home Platform
   */
  public async triggerIdentify(
    requestId: string,
    discoveryBuffer: Buffer,
    deviceId?: string
  ): Promise<string> {
    console.debug('Received discovery payload:', discoveryBuffer);

    // Cannot start processing until all handlers have been set on the `App`
    if (!this.app.identifyHandler) {
      throw new Error(ERROR_UNDEFINED_IDENTIFY_HANDLER);
    }

    const identifyRequest: smarthome.IntentFlow.IdentifyRequest = {
      requestId: requestId,
      inputs: [
        {
          intent: smarthome.Intents.IDENTIFY,
          payload: {
            device: {
              id: deviceId,
              radioTypes: [],
              udpScanData: {data: discoveryBuffer.toString('hex')},
            },
            structureData: {},
            params: {},
          },
        },
      ],
      devices: [],
    };

    const identifyResponse: smarthome.IntentFlow.IdentifyResponse = await this
      .app.identifyHandler!(identifyRequest);

    const device = identifyResponse.payload.device;

    // The handler returned an `IdentifyResponse` that was missing a local device id
    if (device.verificationId === undefined) {
      throw new Error(ERROR_UNDEFINED_VERIFICATIONID);
    }

    console.debug('Registering localDeviceId: ' + device.verificationId);
    this.localDeviceIds.set(device.id, device.verificationId);
    return device.verificationId;
  }

  /**
   * Forms an `ExecuteRequest` with the given commands and passes it to the fulfillment app.
   * @param requestId  The request id to set in the `ExecuteRequest`
   * @param commands  The `ExecuteRequestCommands` to forward to the Execute handler.
   * @returns The list of `ExecuteResponseCommands` that the fulfillment returned.
   */
  public async triggerExecute(
    requestId: string,
    commands: smarthome.IntentFlow.ExecuteRequestCommands[]
  ): Promise<smarthome.IntentFlow.ExecuteResponseCommands[]> {
    commands.forEach(command => {
      command.devices.forEach(device => {
        // Cannot send a `ExecuteRequest` to a device not registered
        if (!this.localDeviceIds.has(device.id)) {
          throw new Error(ERROR_DEVICE_ID_NOT_REGISTERED);
        }
      });
    });

    // No executeHandler found
    if (this.app.executeHandler === undefined) {
      throw new Error(ERROR_UNDEFINED_EXECUTE_HANDLER);
    }

    const executeRequest: smarthome.IntentFlow.ExecuteRequest = {
      requestId,
      inputs: [
        {
          intent: smarthome.Intents.EXECUTE,
          payload: {
            commands,
            structureData: {},
          },
        },
      ],
    };

    // Reset the buffer of commands sent
    this.getDeviceManager().clearCommandsSent();

    const responseCommands = (await this.app.executeHandler(executeRequest))
      .payload.commands;

    return new Promise((resolve, reject) => {
      responseCommands.forEach(command => {
        if (command.status === 'ERROR') {
          reject(new Error(ERROR_EXECUTE_RESPONSE_ERROR_STATUS));
        }
      });
      resolve(responseCommands);
    });
  }
}
