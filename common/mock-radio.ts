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
  hw_rev: string;
  fw_rev: string;
  channels: string;
  constructor(
    id: string,
    model: string,
    hw_rev: string,
    fw_rev: string,
    channels: string
  ) {
    this.id = id;
    this.model = model;
    this.hw_rev = hw_rev;
    this.fw_rev = fw_rev;
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

  sendUDPMessage(msg: Buffer, port: number, address: string) {
    const key: string = address + ':' + port.toString();
    if (this.udpListeners.has(key)) {
      for (const listener of this.udpListeners[key]) {
        listener.onMessaged(msg);
      }
    }
  }
}

export class UDPDevice implements MockUDPListener {
  private udpMessageAction: (msg: Buffer, rinfo: Object) => void;

  onUDPMessage(msg: Buffer, rinfo: Object): void {
    this.udpMessageAction(msg, rinfo);
  }

  setUDPMessageAction(messageAction: (msg: Buffer, rinfo: Object) => void) {
    this.udpMessageAction = messageAction;
  }
}
