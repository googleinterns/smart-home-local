import * as dgram from 'dgram';
const BROADCAST_TIMEOUT = 5000;

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

export class RadioHub {
  public async udpScan(udpScanConfig: UDPScanConfig): Promise<Buffer> {
    const socket = dgram.createSocket('udp4');
    const discoveryBuffer = new Promise<Buffer>(resolve => {
      socket.on('message', msg => {
        socket.close();
        resolve(msg);
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
    const timeout = new Promise(resolve => {
      setTimeout(resolve, BROADCAST_TIMEOUT);
    });
    return Promise.race([
      discoveryBuffer,
      timeout.then(() => {
        socket.close();
        throw new Error(
          'UDP scan timed out after ' + BROADCAST_TIMEOUT.toString() + 'ms.'
        );
      }),
    ]);
  }
}
