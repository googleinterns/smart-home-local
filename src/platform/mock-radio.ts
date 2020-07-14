/*
 * Mock radio for interfacing with mock devices
 */

export interface MockUDPListener {
  /**
   * An interface allowing notification of messages sent through `MockNetwork`
   * @param msg  The message, formatted as a `Buffer`
   * @param rinfo The RemoteAddressInfo containing the address and port that sent the message
   */
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

  /**
   * Initializes an instance of `MockNetwork` with an empty `Map`
   * The key is the port and address as a string
   * The value is a list of `MockUDPListener`s subscribing to that port and address combination
   */
  constructor() {
    this.udpListeners = new Map<string, MockUDPListener[]>();
  }

  /**
   * Registers a `MockUDPListener` with using an associated port and address.
   * Messages sent through `sendUDPMessage()` with matching port and address will notify `listener`.
   * @param listener  The `MockUDPListener` to be notified on matching messages
   * @param port The port of the litener being registered
   * @param address The address of the listener being registered
   */
  public registerUDPListener(
    listener: MockUDPListener,
    port: number,
    address: string
  ) {
    const key = address + ':' + port.toString();
    if (this.udpListeners.has(key)) {
      this.udpListeners.get(key)!.push(listener);
      return;
    }
    this.udpListeners.set(key, [listener]);
  }

  public sendUDPMessage(
    msg: Buffer,
    port: number,
    address: string,
    fromPort: number,
    fromAddress: string
  ) {
    const key = address + ':' + port.toString();
    const listeners = this.udpListeners.get(key);
    if (listeners === undefined) {
      return;
    }
    for (const listener of listeners) {
      const rinfo: RemoteAddressInfo = new RemoteAddressInfo(
        fromAddress,
        '',
        fromPort,
        0
      );
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
}
