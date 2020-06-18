/*
 * Mock radio for interfacing with mock devices
 */

export interface MockUDPListener {
  onUDPMessage(msg: Buffer, rinfo: Object): void;
}

// TODO Builders
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
    const key: string = address + ':' + port.toString();
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
    const key: string = address + ':' + port.toString();
    // TODO check if key present
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
  private udpMessageAction: (msg: Buffer, rinfo: Object) => void;

  onUDPMessage(msg: Buffer, rinfo): void {
    this.udpMessageAction(msg, rinfo);
  }

  setUDPMessageAction(messageAction: (msg: Buffer, rinfo: Object) => void) {
    this.udpMessageAction = messageAction;
  }
}
