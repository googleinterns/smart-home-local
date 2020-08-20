/*
 * An interactive mock implementation of the Local Home Platform.
 */
/// <reference types="@google/local-home-sdk" />
import {AppStub} from './smart-home-app';
import {MockDeviceManager} from './mock-device-manager';

export const ERROR_UNDEFINED_VERIFICATIONID =
  'The handler returned an IdentifyResponse with an undefined verificationId';
export const ERROR_UNDEFINED_IDENTIFY_HANDLER =
  "Couldn't trigger an IdentifyRequest: The App identifyHandler was undefined.";
export const ERROR_UNDEFINED_EXECUTE_HANDLER =
  "Couldn't trigger an ExecuteRequest: The App executeHandler was undefined.";
export const ERROR_NO_LOCAL_DEVICE_ID_FOUND =
  'Cannot get localDeviceId of unregistered deviceId';
export const ERROR_DEVICE_ID_NOT_REGISTERED =
  'Cannot trigger an ExecuteRequest: The provided deviceId was not registered' +
  ' to the platform';
export const ERROR_EXECUTE_RESPONSE_ERROR_STATUS =
  "One or more ExecuteResponseCommands returned with an 'ERROR' status";

export class MockLocalHomePlatform {
  private app: AppStub;
  private deviceManager: smarthome.DeviceManager = new MockDeviceManager();
  private localDeviceIds: Map<string, string> = new Map<string, string>();

  /**
   * Constructs a new MockLocalHomePlatform instance using an App instance.
   * @param app  The AppStub that acts as an interface for intent handlers.
   */
  public constructor(app: AppStub) {
    this.app = app;
  }

  public setDeviceManager(deviceManager: smarthome.DeviceManager): void {
    this.deviceManager = deviceManager;
  }

  public getDeviceManager(): smarthome.DeviceManager {
    return this.deviceManager;
  }

  /**
   * Returns true if the provided deviceId was registered to the platform.
   * Otherwise, returns false.
   * @param deviceId  The deviceId to check.
   * @returns  A boolean indicating whether or not the deviceId is registered.
   */
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
   * Takes a `discoveryBuffer` and passes it to the fulfillment app
   * in an `IdentifyRequest`.
   * @param requestId  The requestId to set on the `IdentifyRequest`.
   * @param discoveryBuffer  The buffer in the `IdentifyRequest` scan data.
   * @param deviceId  The deviceId to register with the recieved localDeviceId.
   * @returns  The next localDeviceId registered to the Local Home Platform.
   */
  public async triggerIdentify(
    requestId: string,
    discoveryBuffer: Buffer,
    deviceId?: string
  ): Promise<string> {
    console.log('Received discovery payload:', discoveryBuffer);

    // Cannot start processing until all handlers have been set on the `App`.
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

    // The returned `IdentifyResponse` was missing a local device id.
    if (device.verificationId === undefined) {
      throw new Error(ERROR_UNDEFINED_VERIFICATIONID);
    }

    console.log('Registering localDeviceId: ' + device.verificationId);
    this.localDeviceIds.set(device.id, device.verificationId);
    return device.verificationId;
  }

  /**
   * Forms an `ExecuteRequest` with the given commands.
   * Passes it to the fulfillment app.
   * @param requestId  The request id to set in the `ExecuteRequest`
   * @param commands  The `ExecuteRequestCommands` to pass to executeHandler.
   * @returns The list of `ExecuteResponseCommands` the fulfillment returned.
   */
  public async triggerExecute(
    requestId: string,
    commands: smarthome.IntentFlow.ExecuteRequestCommands[]
  ): Promise<smarthome.IntentFlow.ExecuteResponseCommands[]> {
    commands.forEach(command => {
      command.devices.forEach(device => {
        // Cannot send a `ExecuteRequest` to a device not registered.
        if (!this.localDeviceIds.has(device.id)) {
          throw new Error(ERROR_DEVICE_ID_NOT_REGISTERED);
        }
      });
    });

    // No executeHandler was found.
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
