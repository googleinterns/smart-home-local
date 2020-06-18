import { MockNetwork, MockUDPListener } from './mock-radio';

// TODO move to another file
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

// TODO add other radio support
export class MockLocalHomePlatform implements MockUDPListener {
  private udpScanConfigs: UDPScanConfig[] = [];
  private network: MockNetwork;

  constructor(network: MockNetwork, udpScanConfigs: UDPScanConfig[]) {
    this.network = network;
    this.udpScanConfigs = udpScanConfigs;
    this.setupUDP();
  }

  // UDP Scan Functionaity

  private setupUDP() {
    this.udpScanConfigs.forEach((udpScanConfig) => {
      this.network.registerUDPListener(
        this,
        udpScanConfig.listenPort,
        udpScanConfig.broadcastAddress
      );
    });
  }

  private sendUDPBroadcast(scanConfig: UDPScanConfig) {
    const packetBuffer = Buffer.from(scanConfig.discoveryPacket, 'hex');
    this.network.sendUDPMessage(
      packetBuffer,
      scanConfig.broadcastPort,
      scanConfig.broadcastAddress,
      scanConfig.listenPort,
      scanConfig.broadcastAddress
    );
  }

  // Establish fulfillment path using app code
  onUDPMessage(msg: Buffer, rinfo: Object): void {
    console.log('received discovery payload:', msg, 'from:', rinfo);
    const identifyRequest: string = JSON.stringify({
      requestId: 'request-id',
      inputs: [
        {
          intent: 'action.devices.IDENTIFY',
          payload: {
            device: {
              radioTypes: [],
              udpScanData: msg.toString('hex'),
            },
            structureData: {},
            params: {},
          },
        },
      ],
      devices: [],
      rinfo,
    });
    const identifyBuffer: Buffer = Buffer.from(identifyRequest, 'utf-8');
    // TODO send this to app.identifyHandler
  }

  public addUDPScanConfig(scanConfig: UDPScanConfig) {
    this.udpScanConfigs.push(scanConfig);
  }

  public triggerScan() {
    // First, UDP
    this.udpScanConfigs.forEach((udpScanConfig) => {
      this.sendUDPBroadcast(udpScanConfig);
    });
  }
}
