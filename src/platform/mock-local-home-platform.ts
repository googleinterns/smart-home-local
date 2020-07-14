/*
 * Mock Local Home Platform class
 */

/// <reference types="@google/local-home-sdk" />
import {AppStub} from './smart-home-app';
import {DeviceManagerStub} from './device-manager';

export const ERROR_UNDEFINED_APP: string =
  'Cannot trigger IdentifyRequest: App was undefined';
export const ERROR_LISTEN_NOT_CALLED: string =
  'Cannot trigger IdentifyRequest: listen() was not called';
export const ERROR_UNDEFINED_VERIFICATIONID: string =
  'The handler returned an IdentifyResponse with an undefined verificationId';

// TODO(cjdaly): add other radio scan support
export class MockLocalHomePlatform {
  //  Singleton instance
  private static instance: MockLocalHomePlatform;

  private deviceManager: smarthome.DeviceManager = new DeviceManagerStub();
  private app: AppStub | undefined;
  private localDeviceIds: Map<string, string> = new Map<string, string>();

  private constructor() {}

  public setApp(app: AppStub) {
    this.app = app;
  }

  public getDeviceManager(): smarthome.DeviceManager {
    return this.deviceManager;
  }

  public getLocalDeviceIdMap(): Map<string, string> {
    return this.localDeviceIds;
  }

  /**
   * Returns the static singleton instance, creating it if needed.
   * @param resetState  Whether or not to force a new instance.  Useful for initializing tests.
   * @returns  The singleton `MockLocalHomePlatform` instance
   */
  public static getInstance(
    resetState: boolean = false
  ): MockLocalHomePlatform {
    if (!MockLocalHomePlatform.instance || resetState) {
      MockLocalHomePlatform.instance = new MockLocalHomePlatform();
    }
    return MockLocalHomePlatform.instance;
  }

  /**
   * Takes a `discoveryBuffer` and passes it to the fulfillment app in an `IdentifyRequest`
   * @param discoveryBuffer  The buffer to be included in the `IdentifyRequest` scan data
   * @returns  The next localDeviceId registered to the Local Home Platform
   */
  public async triggerIdentify(discoveryBuffer: Buffer): Promise<string> {
    console.debug('Received discovery payload:', discoveryBuffer);

    // Need a reference to the `App` instance to be able to pass an `IdentifyRequest`
    if (this.app === undefined) {
      return Promise.reject(new Error(ERROR_UNDEFINED_APP));
    }

    // Cannot start processing until all handlers have been set on the `App`
    if (!this.app.isAllHandlersSet()) {
      return Promise.reject(new Error(ERROR_LISTEN_NOT_CALLED));
    }

    const identifyRequest: smarthome.IntentFlow.IdentifyRequest = {
      requestId: 'request-id',
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
      return Promise.reject(new Error(ERROR_UNDEFINED_VERIFICATIONID));
    }
    console.log('Registering localDeviceId: ' + device.verificationId);
    this.localDeviceIds.set(device.id, device.verificationId);
    return Promise.resolve(device.verificationId);
  }
}
