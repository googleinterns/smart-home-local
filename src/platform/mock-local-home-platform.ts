/*
 * Mock Local Home Platform class
 * - Interacts with bundled HomeApp
 * - Accepts scan config
 * - Interacts with virtual network
 */

/// <reference types="@google/local-home-sdk" />
import {MockNetwork, MockUDPListener, RemoteAddressInfo} from './mock-radio';
import {DeviceManagerStub} from './device-manager';
import {AppStub} from './smart-home-app';

export enum ScanState {
  Unprovisioned,
  Provisioned,
}

interface ScanConfig {
  state: ScanState;
}

export class UDPScanConfig implements ScanConfig {
  state: ScanState;
  broadcastAddress: string;
  listenPort: number;
  broadcastPort: number;
  discoveryPacket: string;
  constructor(
    state: ScanState,
    broadcastAddress: string,
    listenport: number,
    broadcastPort: number,
    discoveryPacket: string
  ) {
    this.state = state;
    this.broadcastAddress = broadcastAddress;
    this.broadcastPort = broadcastPort;
    this.listenPort = listenport;
    this.discoveryPacket = discoveryPacket;
  }
}

// TODO(cjdaly): add other radio scan support
export class MockLocalHomePlatform implements MockUDPListener {
  //  Singleton instance
  private static instance: MockLocalHomePlatform;

  private udpScanConfigs: UDPScanConfig[] = [];
  private mockNetwork: MockNetwork | undefined;
  private deviceManager: smarthome.DeviceManager = new DeviceManagerStub();
  private app: AppStub | undefined;
  private localDeviceIds: Map<string, string> = new Map<string, string>();
  private newDeviceRegisteredActions: ((localDeviceId: string) => void)[] = [];
  private homeAppReady: boolean = false;

  private constructor() {}

  public initializeRadio(
    mockNetwork: MockNetwork,
    udpScanConfigs: UDPScanConfig[]
  ) {
    this.mockNetwork = mockNetwork;
    this.udpScanConfigs = udpScanConfigs;
    this.setupUDP();
  }

  public setApp(app: AppStub) {
    this.app = app;
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

  public isHomeAppReady(): boolean {
    return this.homeAppReady;
  }

  public notifyHomeAppReady(): void {
    this.homeAppReady = true;
  }

  //  Singleton getter
  public static getInstance(): MockLocalHomePlatform {
    if (!MockLocalHomePlatform.instance) {
      MockLocalHomePlatform.instance = new MockLocalHomePlatform();
    }
    return MockLocalHomePlatform.instance;
  }

  public getDeviceManager(): smarthome.DeviceManager {
    return this.deviceManager;
  }

  public getLocalDeviceIdMap(): Map<string, string> {
    return this.localDeviceIds;
  }

  private setupUDP() {
    this.udpScanConfigs.forEach(udpScanConfig => {
      this.mockNetwork!.registerUDPListener(
        this,
        udpScanConfig.listenPort,
        udpScanConfig.broadcastAddress
      );
    });
  }

  private sendUDPBroadcast(scanConfig: UDPScanConfig) {
    const packetBuffer = Buffer.from(scanConfig.discoveryPacket, 'hex');
    this.mockNetwork!.sendUDPMessage(
      packetBuffer,
      scanConfig.broadcastPort,
      scanConfig.broadcastAddress,
      scanConfig.listenPort,
      scanConfig.broadcastAddress
    );
  }

  // Establish fulfillment path using app code
  async onUDPMessage(msg: Buffer, rinfo: RemoteAddressInfo): Promise<void> {
    if (this.app === undefined) {
      throw new Error('Cannot trigger IdentifyRequest: App was undefined');
    }
    if (!this.isHomeAppReady()) {
      throw new Error(
        'Cannot trigger IdentifyRequest: listen() was not called'
      );
    }

    console.log('received discovery payload:', msg, 'from:', rinfo);

    const identifyRequest: smarthome.IntentFlow.IdentifyRequest = {
      requestId: 'request-id',
      inputs: [
        {
          intent: smarthome.Intents.IDENTIFY,
          payload: {
            device: {
              radioTypes: [],
              udpScanData: {data: msg.toString('hex')},
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

  public addUDPScanConfig(scanConfig: UDPScanConfig) {
    this.udpScanConfigs.push(scanConfig);
  }

  public triggerScan() {
    this.udpScanConfigs.forEach(udpScanConfig => {
      this.sendUDPBroadcast(udpScanConfig);
    });
    // TODO(cjdaly) other scans
  }
}
