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
  state: ScanState;gt
  broadcastaddress: string;
  listenport: number;
  broadcastport: number;
  discoverypacket: string;
  constructor(
    state: ScanState,
    broadcastaddress: string,
    listenport: number,
    broadcastport: number,
    discoverypacket: string
  ) {
    this.state = state;
    this.broadcastaddress = broadcastaddress;
    this.listenport = listenport;
    this.discoverypacket = discoverypacket;
  }
}

// TODO add other radio support
export class MockLocalHomePlatform implements MockUDPListener{
  private udpdcanConfigs: UDPScanConfig[];
  private network: MockNetwork;

  constructor(network: MockNetwork) {
    this.network = network;
    this.udpdcanConfigs = [];
  }

  // Establish fulfillment path using app code 
  onUDPMessage(msg: Buffer, rinfo: Object): void {

  }

  addUDPScanConfig(scanConfig: UDPScanConfig) {
    this.udpdcanConfigs.push(scanConfig);
  }

  triggerScan() {
    // First, UDP
    // Send a discovery message out
  }
}
