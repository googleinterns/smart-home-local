import {TcpResponse, UdpResponse, HttpResponse} from './dataflow';
import * as dgram from 'dgram';
import * as http from 'http';
import * as net from 'net';

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
   * @param listenPort  The listen port for the UDP response.
   * @param discoveryPacket  The payload to send in the UDP broadcast.
   * @returns  A new `UDPScanConfig` instance.
   */
  constructor(
    broadcastAddress: string,
    broadcastPort: number,
    listenPort: number,
    discoveryPacket: string
  ) {
    this.broadcastAddress = broadcastAddress;
    this.broadcastPort = broadcastPort;
    this.listenPort = listenPort;
    this.discoveryPacket = discoveryPacket;
  }
}

/**
 * A class to contain the information from a UDP scan.
 */
export interface UDPScanResults {
  buffer: Buffer;
  rinfo: dgram.RemoteInfo;
}

/**
 * A class to contain all Node radio functionality.
 */
export class RadioController {
  /**
   * A helper function to create timeout promises.
   * @returns  A new Promise that resolves after RADIO_TIMEOUT milliseconds.
   */
  private createTimeoutPromise(timeout: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, timeout);
    });
  }

  /**
   * Performs a UDP scan according to a `UDPScanConfig`.
   * @param udpScanConfig  A scan configuration containing UDP parameters.
   * @param timeout  How long in ms to wait before timing out the request.
   * @return  A promise that resolves to the determined `UDPScanResults`
   */
  public async udpScan(
    udpScanConfig: UDPScanConfig,
    timeout = RADIO_TIMEOUT
  ): Promise<UDPScanResults> {
    // Open a UDP socket.
    const socket = dgram.createSocket('udp4');
    const discoveryBuffer = new Promise<UDPScanResults>(resolve => {
      // Resolve promise when a broadcast buffer is recieved.
      socket.on('message', (buffer, rinfo) => {
        // Close the socket.
        socket.close();
        resolve({buffer, rinfo});
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
          if (error) {
            throw new Error(
              `Failed to send UDP discovery packet:\n${error.message}`
            );
          }
          console.log('Sent UDP discovery packet: ', payload);
        }
      );
    });
    // Timeout if there hasn't been a response.
    return Promise.race([
      discoveryBuffer,
      this.createTimeoutPromise(timeout).then(() => {
        // Close the socket if timed out
        socket.close();
        throw new Error(`UDP scan timed out after ${timeout}ms.`);
      }),
    ]);
  }

  /**
   * Sends a UDP message using the given parameters
   * @param payload  The payload to send in the UDP message.
   * @param address  The destination address of the UDP message.
   * @param listenPort  The port to listen on for a response, if execting one.
   * @param expectedResponsePackets  The number of responses to save before resolving.
   * @param timeout  How long in ms to wait before timing out the request.
   * @returns  A promise that resolves to the determined `UDPResponse`.
   */
  public async sendUdpMessage(
    payload: Buffer,
    address: string,
    port: number,
    listenPort: number,
    expectedResponsePackets = 0,
    timeout = RADIO_TIMEOUT
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
        socket.bind(listenPort, () => {
          // Send the UDP message, forwarding the given parameters.
          socket.send(payload, port, address, error => {
            if (error) {
              throw new Error(`Failed to send UDP message: ${error.message}`);
            }
            console.log('Sent UDP message: ', payload);
            if (expectedResponsePackets === 0) {
              // Resolve early if we aren't expecting any response.
              resolve(new UdpResponse());
            }
          });
        });
      }
    );
    // Timeout if still waiting for a response.
    return Promise.race([
      discoveryBuffer,
      this.createTimeoutPromise(timeout).then(() => {
        socket.close();
        throw new Error(`UDP send timed out after ${timeout} ms.`);
      }),
    ]);
  }

  /**
   * Reads data from a TCP socket.
   * @param address  The address to open a TCP socket on.
   * @param port  The port to open a TCP socket on.
   * @param timeout  How long in ms to wait before timing out the request.
   * @returns  The data read from the TCP socket.
   */
  public async readTcpSocket(
    address: string,
    port: number,
    timeout = RADIO_TIMEOUT
  ): Promise<smarthome.DataFlow.TcpResponse> {
    // Open the socket.
    const client = net.createConnection(port, address, () => {});
    const discoveryBuffer = new Promise<smarthome.DataFlow.TcpResponse>(
      resolve => {
        // Resolve when data is recieved.
        client.on('data', data => {
          client.on('end', () => {
            resolve(new TcpResponse(data.toString('hex')));
          });
          client.end();
        });
      }
    );
    // Timeout if we haven't recieved data.
    return Promise.race([
      discoveryBuffer,
      this.createTimeoutPromise(timeout).then(() => {
        client.destroy();
        throw new Error(`TCP read timed out after ${timeout}ms.`);
      }),
    ]);
  }

  /**
   * Sends an HTTP GET request using the provided parameters.
   * @param host  The address to send the HTTP GET request to.
   * @param port  The port to send the HTTP GET request to.
   * @param path  The path to send the HTTP GET request to.
   * @param timeout  How long to wait before rejecting with a timeout.
   */
  public async sendHttpGet(
    host: string,
    port: number,
    path: string,
    timeout = RADIO_TIMEOUT
  ): Promise<smarthome.DataFlow.HttpResponse> {
    const options = {
      host,
      port,
      path,
    };
    const httpResponse = new Promise<smarthome.DataFlow.HttpResponse>(
      resolve => {
        http.get(options, res => {
          const {statusCode} = res;
          const dataBuffer: string[] = [];
          if (statusCode !== 200) {
            throw new Error(`Request Failed.\nStatus Code: ${statusCode}`);
          }
          res.setEncoding('utf8');
          res.on('data', chunk => {
            dataBuffer.push(chunk);
          });
          res.on('end', () => {
            resolve(new HttpResponse(dataBuffer.join(''), statusCode));
          });
        });
      }
    );
    // Timeout if still waiting for a response.
    return Promise.race([
      httpResponse,
      this.createTimeoutPromise(timeout).then(() => {
        throw new Error(`HTTP GET request timed out after ${timeout}ms.`);
      }),
    ]);
  }

  /**
   * Open a TCP socket and write to it.
   * @param payload  The payload to send in the TCP write.
   * @param address  The address to write to.
   * @param port  The port to write to.
   * @param timeout  How long in ms to wait before timing out the request.
   * @returns  A promise that resolves to the determined `TcpResponse`.
   */
  public async writeTcpSocket(
    payload: Buffer,
    address: string,
    port: number,
    timeout = RADIO_TIMEOUT
  ): Promise<TcpResponse> {
    const discoveryBuffer = new Promise<smarthome.DataFlow.TcpResponse>(
      resolve => {
        // Open a socket and immediately write to it.
        const client = net.createConnection(port, address, () => {
          client.write(payload);
          client.end();
          resolve(new TcpResponse());
        });
      }
    );
    // Timeout if writing takes too long.
    return Promise.race([
      discoveryBuffer,
      this.createTimeoutPromise(timeout).then(() => {
        throw new Error(`TCP write timed out after ${timeout}ms.`);
      }),
    ]);
  }

  /**
   * Sends an HTTP POST request using the provided parameters.
   * @param host  The address to send the HTTP POST request to.
   * @param port  The port to send the HTTP POST request to.
   * @param path  The path to send the HTTP POST request to.
   * @param timeout  How long to wait before rejecting with a timeout.
   */
  public async sendHttpPost(
    host: string,
    port: number,
    path: string,
    dataType: string,
    data: string,
    timeout = RADIO_TIMEOUT
  ): Promise<smarthome.DataFlow.HttpResponse> {
    const options = {
      host,
      port,
      path,
      method: 'POST',
      headers: {
        'Content-Type': dataType,
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const httpResponse = new Promise<smarthome.DataFlow.HttpResponse>(
      resolve => {
        const postRequest = http.request(options, res => {
          const {statusCode} = res;
          const dataBuffer: string[] = [];
          if (statusCode !== 200) {
            throw new Error(`Request Failed.\nStatus Code: ${statusCode}`);
          }
          res.setEncoding('utf8');
          res.on('data', chunk => {
            dataBuffer.push(chunk);
          });
          res.on('end', () => {
            resolve(new HttpResponse(dataBuffer.join(''), statusCode));
          });
        });
        postRequest.write(data);
        postRequest.end();
      }
    );
    // Timeout if still waiting for a response.
    return Promise.race([
      httpResponse,
      this.createTimeoutPromise(timeout).then(() => {
        throw new Error(`HTTP POST request timed out after ${timeout}ms.`);
      }),
    ]);
  }
}
