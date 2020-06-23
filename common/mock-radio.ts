/*
 * Mock radio for interfacing with mock devices
 */

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

// TODO(cjdaly) Builders
export class DiscoveryData {
  id: string;
  model: string;
  hwRev: string;
  fwRev: string;
  channels: number[];
  constructor(
    id: string,
    model: string,
    hwRev: string,
    fwRev: string,
    channels: number[]
  ) {
    this.id = id;
    this.model = model;
    this.hwRev = hwRev;
    this.fwRev = fwRev;
    this.channels = channels;
  }
}

// Simulates a network with simple UDP messaging functionality
export class MockNetwork {
  udpListeners: Map<string, MockUDPListener[]>;

  constructor() {
    this.udpListeners = new Map<string, MockUDPListener[]>();
  }

  registerUDPListener(
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

export class UDPDevice implements MockUDPListener {
  private udpMessageAction: (msg: Buffer, rinfo: RemoteAddressInfo) => void;

  onUDPMessage(msg: Buffer, rinfo: RemoteAddressInfo): void {
    this.udpMessageAction(msg, rinfo);
  }

  setUDPMessageAction(
    messageAction: (msg: Buffer, rinfo: RemoteAddressInfo) => void
  ) {
    this.udpMessageAction = messageAction;
  }
}
