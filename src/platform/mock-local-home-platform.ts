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
export const ERROR_NO_LOCAL_DEVICE_ID_FOUND: string =
  'Cannot get localDeviceId of unregistered deviceId';

// TODO(cjdaly): add other radio scan support
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
   * @param discoveryBuffer  The buffer to be included in the `IdentifyRequest` scan data
   * @returns  The next localDeviceId registered to the Local Home Platform
   */
  public async triggerIdentify(
    requestId: string,
    discoveryBuffer: Buffer
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
    if (device.verificationId == null) {
      throw new Error(ERROR_UNDEFINED_VERIFICATIONID);
    }
    console.debug('Registering localDeviceId: ' + device.verificationId);
    this.localDeviceIds.set(device.id, device.verificationId);
    return device.verificationId;
  }

  public async triggerExecute(
    requestId: string,
    deviceId: string,
    command: string,
    params: object
  ): Promise<smarthome.IntentFlow.ExecuteStatus> {
    if (!this.localDeviceIds.has(deviceId)) {
      throw new Error("deviceId didn't match")
    }

    const executeRequest: smarthome.IntentFlow.ExecuteRequest = {
      requestId: requestId,
      inputs: [
        {
          intent: smarthome.Intents.EXECUTE,
          payload: {
            //TODO(cjdaly) allow multiple commands
            commands: [
              {
                execution: [
                  {
                    command,
                    params,
                  },
                ],
                devices: [
                  {
                    id: deviceId,
                  },
                ],
              },
            ],
            structureData: {},
          },
        },
      ],
    };

    if (this.app.executeHandler === undefined) {
      throw new Error('Undefined Execute Handler');
    }

    const response = await this.app.executeHandler(executeRequest);

    if (response.payload.commands.length != 1) {
      throw new Error('Expected 1 command in ExecuteResponse');
    }

    if (response.payload.commands[0].status != 'ERROR') {
      return 'SUCCESS';
    }

    throw new Error('ERROR');
  }
}
