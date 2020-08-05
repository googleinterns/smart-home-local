import * as dgram from 'dgram';
import * as net from 'net';
import {TcpResponse, UdpResponse} from './dataflow';
const RADIO_TIMEOUT = 5000;

export class UDPScanConfig {
  broadcastAddress: string;
  broadcastPort: number;
  listenPort: number;
  discoveryPacket: string;
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

export interface UDPScanResults {
  buffer: Buffer;
  address: string;
}

/**
 * A class to contain all Node radio functionality.
 */
export class RadioController {
  private createTimeoutPromise(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, RADIO_TIMEOUT);
    });
  }

  public async udpScan(udpScanConfig: UDPScanConfig): Promise<UDPScanResults> {
    const socket = dgram.createSocket('udp4');
    const discoveryBuffer = new Promise<UDPScanResults>(resolve => {
      socket.on('message', (msg, rinfo) => {
        socket.close();
        resolve({buffer: msg, address: rinfo.address});
      });
      socket.on('listening', () => {
        socket.setBroadcast(true);
      });
      socket.bind(udpScanConfig.listenPort);
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
          console.log('Sent UDP discoery packet: ', payload);
        }
      );
    });
    return Promise.race([
      discoveryBuffer,
      this.createTimeoutPromise().then(() => {
        socket.close();
        throw new Error(
          'UDP scan timed out after ' + RADIO_TIMEOUT.toString() + 'ms.'
        );
      }),
    ]);
  }

  public async sendUdpMessage(
    payload: Buffer,
    address: string,
    port: number,
    listenPort: number,
    expectedResponsePackets = 0
  ): Promise<smarthome.DataFlow.UdpResponse> {
    const responsePackets: string[] = [];
    const socket = dgram.createSocket('udp4');
    console.log('sending udp');
    const discoveryBuffer = new Promise<smarthome.DataFlow.UdpResponse>(
      resolve => {
        socket.on('message', msg => {
          responsePackets.push(msg.toString('hex'));
          if (responsePackets.length >= expectedResponsePackets) {
            socket.close();
            resolve(new UdpResponse(responsePackets));
          }
        });
        socket.bind(listenPort);
        socket.send(payload, port, address, error => {
          if (error !== null) {
            throw new Error('Failed to send UDP message:' + error.message);
          }
          console.log('Sent UDP message: ', payload);
          if (expectedResponsePackets === 0) {
            resolve(new UdpResponse());
          }
        });
      }
    );
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

  public async readTcpSocket(
    address: string,
    port: number
  ): Promise<smarthome.DataFlow.TcpResponse> {
    const client = net.createConnection(port, address, () => {});
    const discoveryBuffer = new Promise<smarthome.DataFlow.TcpResponse>(
      resolve => {
        client.on('data', data => {
          client.end();
          resolve(new TcpResponse(data.toString('hex')));
        });
      }
    );
    return Promise.race([
      discoveryBuffer,
      this.createTimeoutPromise().then(() => {
        client.end();
        throw new Error(
          'TCP read timed out after ' + RADIO_TIMEOUT.toString() + 'ms.'
        );
      }),
    ]);
  }

  public async writeTcpSocket(
    payload: Buffer,
    address: string,
    port: number
  ): Promise<TcpResponse> {
    const discoveryBuffer = new Promise<smarthome.DataFlow.TcpResponse>(
      resolve => {
        const client = net.createConnection(port, address, () => {
          client.write(payload);
          client.end();
          resolve(new TcpResponse());
        });
      }
    );
    return Promise.race([
      discoveryBuffer,
      this.createTimeoutPromise().then(() => {
        throw new Error(
          'TCP write timed out after ' + RADIO_TIMEOUT.toString() + 'ms.'
        );
      }),
    ]);
  }
}
