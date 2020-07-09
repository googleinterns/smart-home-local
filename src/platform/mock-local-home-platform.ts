/*
 * Mock Local Home Platform class
 */

/// <reference types="@google/local-home-sdk" />
import {AppStub} from './smart-home-app';
import {DeviceManagerStub} from './device-manager';

// TODO(cjdaly): add other radio scan support
export class MockLocalHomePlatform {
  //  Singleton instance
  private static instance: MockLocalHomePlatform;

  private deviceManager: smarthome.DeviceManager = new DeviceManagerStub();
  private app: AppStub | undefined;
  private localDeviceIds: Map<string, string> = new Map<string, string>();
  private newDeviceRegisteredActions: ((localDeviceId: string) => void)[] = [];
  private homeAppReady: boolean = false;

  private constructor() {}

  public setApp(app: AppStub) {
    this.app = app;
  }

  public isHomeAppReady(): boolean {
    return this.homeAppReady;
  }

  public notifyHomeAppReady(): void {
    this.homeAppReady = true;
  }

  public getDeviceManager(): smarthome.DeviceManager {
    return this.deviceManager;
  }

  public getLocalDeviceIdMap(): Map<string, string> {
    return this.localDeviceIds;
  }

  //  Singleton getter
  public static getInstance(): MockLocalHomePlatform {
    if (!MockLocalHomePlatform.instance) {
      MockLocalHomePlatform.instance = new MockLocalHomePlatform();
    }
    return MockLocalHomePlatform.instance;
  }

  private onNewDeviceIdRegistered(localDeviceId: string) {
    this.newDeviceRegisteredActions.forEach(newDeviceRegisteredAction => {
      newDeviceRegisteredAction(localDeviceId);
    });
  }

  public async getNextDeviceIdRegistered(): Promise<string> {
    return new Promise(resolve => {
      this.newDeviceRegisteredActions.push(localDeviceId => {
        resolve(localDeviceId);
      });
    });
  }

  /**
   * Takes a `discoveryBuffer` and passes it to the fulfillment app in an `IdentifyRequest`
   * @param discoveryBuffer  the buffer to be included in the `IdentifyRequest` scan data
   */
  public async triggerIdentify(discoveryBuffer: Buffer): Promise<void> {
    console.log('received discovery payload:', discoveryBuffer);

    if (this.app === undefined) {
      throw new Error('Cannot trigger IdentifyRequest: App was undefined');
    }
    if (!this.isHomeAppReady()) {
      throw new Error(
        'Cannot trigger IdentifyRequest: listen() was not called'
      );
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

    if (this.app.identifyHandler === undefined) {
      throw new Error(
        'identifyHandler has not been set by the fulfillment HomeApp'
      );
    }
    const identifyResponse: smarthome.IntentFlow.IdentifyResponse = await this.app.identifyHandler(
      identifyRequest
    );

    const device = identifyResponse.payload.device;
    if (device.verificationId == null) {
      throw new Error(
        'Cannot register a localDeviceId: verficationId from IdentifyResponse was undefined'
      );
    }
    console.log('Registering localDeviceId: ' + device.verificationId);
    this.localDeviceIds.set(device.id, device.verificationId);
    this.onNewDeviceIdRegistered(device.verificationId);
  }
}
