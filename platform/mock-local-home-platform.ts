/*
 * Mock Local Home Platform class
 * - Interacts with bundled HomeApp
 * - Accepts scan config
 * - Interacts with virtual network
 */

/// <reference types="@google/local-home-sdk" />
import { MockNetwork, MockUDPListener, RemoteAddressInfo } from './mock-radio';
import { DeviceManagerStub } from './device-manager';
import { AppStub } from './smart-home-app';

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
  private mockNetwork: MockNetwork;
  private app: AppStub;
  private deviceManager: smarthome.DeviceManager;
  private localDeviceIds: string[] = [];

  private constructor() {}

  public initializeRadio(
    mockNetwork: MockNetwork,
    udpScanConfigs: UDPScanConfig[]
  ) {
    this.mockNetwork = mockNetwork;
    this.deviceManager = new DeviceManagerStub(mockNetwork);
    this.udpScanConfigs = udpScanConfigs;
    this.setupUDP();
  }

  public setApp(app: AppStub) {
    this.app = app;
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

  public getLocalDeviceIds(): string[] {
    return this.localDeviceIds;
  }

  private setupUDP() {
    this.udpScanConfigs.forEach((udpScanConfig) => {
      this.mockNetwork.registerUDPListener(
        this,
        udpScanConfig.listenPort,
        udpScanConfig.broadcastAddress
      );
    });
  }

  private sendUDPBroadcast(scanConfig: UDPScanConfig) {
    const packetBuffer = Buffer.from(scanConfig.discoveryPacket, 'hex');
    this.mockNetwork.sendUDPMessage(
      packetBuffer,
      scanConfig.broadcastPort,
      scanConfig.broadcastAddress,
      scanConfig.listenPort,
      scanConfig.broadcastAddress
    );
  }
  private isPromise<RS>(response: RS | Promise<RS>): response is Promise<RS> {
    return (response as Promise<RS>).then !== undefined;
  }

  private async processIntentResponse<RS>(
    response: RS | Promise<RS>
  ): Promise<RS> {
    if (this.isPromise<RS>(response)) {
      return response;
    } else {
      return Promise.resolve(response);
    }
  }

  // Establish fulfillment path using app code
  onUDPMessage(msg: Buffer, rinfo: RemoteAddressInfo): void {
    console.log('received discovery payload:', msg, 'from:', rinfo);

    const identifyRequest: smarthome.IntentFlow.IdentifyRequest = {
      requestId: 'request-id',
      inputs: [
        {
          intent: smarthome.Intents.IDENTIFY,
          payload: {
            device: {
              radioTypes: [],
              udpScanData: { data: msg.toString('hex') },
            },
            structureData: {},
            params: {},
          },
        },
      ],
      devices: [],
    };

    this.processIntentResponse<smarthome.IntentFlow.IdentifyResponse>(
      this.app.identifyHandler(identifyRequest)
    ).then((identifyResponse: smarthome.IntentFlow.IdentifyResponse) => {
      const localDeviceId: string = identifyResponse.payload.device.id;
      console.log('Registering localDeviceId: ' + localDeviceId);
      this.localDeviceIds.push(localDeviceId);
    });
  }

  public addUDPScanConfig(scanConfig: UDPScanConfig) {
    this.udpScanConfigs.push(scanConfig);
  }

  public triggerScan() {
    this.udpScanConfigs.forEach((udpScanConfig) => {
      this.sendUDPBroadcast(udpScanConfig);
    });
    // TODO(cjdaly) other scans
  }
}
