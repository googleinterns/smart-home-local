/*
 * Mock Local Home Platform class
 * - Interacts with bundled HomeApp
 * - Accepts scan config
 * - Interacts with virtual network
 */

/// <reference types="@google/local-home-sdk" />
import {
  MockNetwork,
  MockUDPListener,
  DiscoveryData,
  RemoteAddressInfo,
} from './mock-radio';
import cbor from 'cbor';

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

// TODO(cjdaly): figure out how to direct arbitrary instances of stub classes to an arbitrary
// instance of MockLocalHomePlatform. May need to use some static event or singleton pattern.

// TODO(cjdaly): add other radio scan support
export class MockLocalHomePlatform implements MockUDPListener {
  private udpScanConfigs: UDPScanConfig[] = [];
  private network: MockNetwork;
  private smarthomeApp: smarthome.App;
  private localDeviceIds: string[] = [];

  constructor(network: MockNetwork, udpScanConfigs: UDPScanConfig[]) {
    this.network = network;
    this.udpScanConfigs = udpScanConfigs;
    this.smarthomeApp = new smarthome.App('0.0.1');
    this.setupUDP();
  }

  public getLocalDeviceIds(): string[] {
    return this.localDeviceIds;
  }

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
  onUDPMessage(msg: Buffer, rinfo: RemoteAddressInfo): void {
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

    // TODO(cjdaly): send this to homeApp.identifyHandler
    const discoveryData: DiscoveryData = cbor.decodeFirstSync(msg);
    this.localDeviceIds.push(discoveryData.id);
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
