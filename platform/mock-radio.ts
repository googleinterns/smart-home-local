/*
 * Mock radio for interfacing with mock devices
 */

import { UDPScanConfig } from './mock-local-home-platform';

export interface MockUDPListener {
  onUDPMessage(msg: Buffer, rinfo: RemoteAddressInfo): void;
}

export class RemoteAddressInfo {
  address: string;
  family: string;
  port: number;
  size: number;
  constructor(address: string, family: string, port: number, size: number) {
    this.address = address;
    this.family = family;
    this.port = port;
    this.size = size;
  }
}

// Simulates a network with simple UDP messaging functionality
export class MockNetwork {
  udpListeners: Map<string, MockUDPListener[]>;

  constructor() {
    this.udpListeners = new Map<string, MockUDPListener[]>();
  }

  public registerUDPListener(
    listener: MockUDPListener,
    port: number,
    address: string
  ) {
    const key = address + ':' + port.toString();
    if (this.udpListeners.has(key)) {
      this.udpListeners[key].push(listener);
      return;
    }
    this.udpListeners[key] = [listener];
  }

  public sendUDPMessage(
    msg: Buffer,
    port: number,
    address: string,
    fromPort: number,
    fromAddress: string
  ) {
    const key = address + ':' + port.toString();
    for (const listener of this.udpListeners[key]) {
      const rinfo = {
        port: fromPort,
        address: fromAddress,
      };
      listener.onUDPMessage(msg, rinfo);
    }
  }
}

export class UDPDevice {
  private deviceId: string;
  private port: number;
  private address: string;
  private network: MockNetwork;

  public constructor(
    deviceId: string,
    network: MockNetwork,
    port: number,
    address: string
  ) {
    this.deviceId = deviceId;
    this.network = network;
    this.port = port;
    this.address = address;
  }

  public getDeviceId(): string {
    return this.deviceId;
  }

  public getDevicePort(): number {
    return this.port;
  }

  /**
   * Sends a `discoveryBuffer` to the port specified in a `UDPScanConfig`
   * @param discoveryBuffer
   * @param scanConfig
   */
  public sendDiscoveryBuffer(
    discoveryBuffer: Buffer,
    scanConfig: UDPScanConfig
  ): void {
    this.network.sendUDPMessage(
      discoveryBuffer,
      scanConfig.listenPort,
      scanConfig.broadcastAddress,
      this.port,
      this.address
    );
  }
}
