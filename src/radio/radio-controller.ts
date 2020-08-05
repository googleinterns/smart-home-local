import * as dgram from 'dgram';
import {UdpResponse} from './dataflow';

/**
 * A default radio timeout, in milliseconds.
 */
const RADIO_TIMEOUT = 2500;

/**
 * A class to contain all parameters required to perform
 * a UDP scan.
 */
export class UDPScanConfig {
  broadcastAddress: string;
  broadcastPort: number;
  listenPort: number;
  discoveryPacket: string;
  /**
   *
   * @param broadcastAddress  The destination UDP broadcast address.
   * @param broadcastPort  The destination UDP broadcast port.
   * @param listenport  The listen port for the UDP response.
   * @param discoveryPacket  The payload to send in the UDP broadcast.
   * @returns  A new `UDPScanConfig` instance.
   */
  constructor(
    broadcastAddress: string,
    broadcastPort: number,
    listenport: number,
    discoveryPacket: string
  ) {
    this.broadcastAddress = broadcastAddress;
    this.broadcastPort = broadcastPort;
    this.listenPort = listenport;
    this.discoveryPacket = discoveryPacket;
  }
}

/**
 * A class to contain the information from a UDP scan.
 */
export interface UDPScanResults {
  buffer: Buffer;
  address: string;
}

/**
 * A class to contain all Node radio functionality.
 */
export class RadioController {
  /**
   * A helper function to create timeout promises.
   * @returns  A new Promise that resolves after RADIO_TIMEOUS milliseconds.
   */
  private createTimeoutPromise(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, RADIO_TIMEOUT);
    });
  }

  /**
   * Performs a UDP scan according to a `UDPScanConfig`.
   * @param udpScanConfig  A scan configuration containing UDP parameters.
   * @return  A promise that resolves to the determined `UDPScanResults`
   */
  public async udpScan(udpScanConfig: UDPScanConfig): Promise<UDPScanResults> {
    // Open a UDP socket.
    const socket = dgram.createSocket('udp4');
    const discoveryBuffer = new Promise<UDPScanResults>(resolve => {
      // Resolve promise when a broadcast buffer is recieved.
      socket.on('message', (msg, rinfo) => {
        // Close the socket.
        socket.close();
        resolve({buffer: msg, address: rinfo.address});
      });

      // Enable UDP broadcast.
      socket.on('listening', () => {
        socket.setBroadcast(true);
      });
      socket.bind(udpScanConfig.listenPort);

      // Decode the discovery packet and send it.
      const payload = Buffer.from(udpScanConfig.discoveryPacket, 'hex');
      socket.send(
        payload,
        udpScanConfig.broadcastPort,
        udpScanConfig.broadcastAddress,
        error => {
          if (error !== null) {
            throw new Error(
              'Failed to send UDP discovery packet:' + error.message
            );
          }
          console.log('Sent UDP discovery packet: ', payload);
        }
      );
    });
    // Timeout if there hasn't been a response.
    return Promise.race([
      discoveryBuffer,
      this.createTimeoutPromise().then(() => {
        // Close the socket if timed out
        socket.close();
        throw new Error(
          'UDP scan timed out after ' + RADIO_TIMEOUT.toString() + 'ms.'
        );
      }),
    ]);
  }

  /**
   * Sends a UDP message using the given parameters
   * @param payload  The payload to send in the UDP message.
   * @param address  The destination address of the UDP message.
   * @param lisenPort  The port to listen on for a response, if execting one.
   * @param expectedResponsePackets  The number of responses to save before resolving.
   * @returns  A promise that resolves to the determined `UDPResponse`.
   */
  public async sendUdpMessage(
    payload: Buffer,
    address: string,
    port: number,
    listenPort: number,
    expectedResponsePackets = 0
  ): Promise<smarthome.DataFlow.UdpResponse> {
    const responsePackets: string[] = [];
    // Open a UDP socket
    const socket = dgram.createSocket('udp4');
    const discoveryBuffer = new Promise<smarthome.DataFlow.UdpResponse>(
      resolve => {
        // Record any UDP messages as responses.
        socket.on('message', msg => {
          responsePackets.push(msg.toString('hex'));
          if (responsePackets.length >= expectedResponsePackets) {
            socket.close();
            resolve(new UdpResponse(responsePackets));
          }
        });
        // Start listening for responses.
        socket.bind(listenPort);
        // Send the UDP message, forwarding the given parameters.
        socket.send(payload, port, address, error => {
          if (error !== null) {
            throw new Error('Failed to send UDP message:' + error.message);
          }
          console.log('Sent UDP message: ', payload);
          if (expectedResponsePackets === 0) {
            // Resolve early if we aren't expecting any response.
            resolve(new UdpResponse());
          }
        });
      }
    );
    // Timeout if still waiting for a response.
    return Promise.race([
      discoveryBuffer,
      this.createTimeoutPromise().then(() => {
        socket.close();
        throw new Error(
          'UDP send timed out after ' + RADIO_TIMEOUT.toString() + 'ms.'
        );
      }),
    ]);
  }
}
