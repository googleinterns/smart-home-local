import test from 'ava';
import * as dgram from 'dgram';
import {RadioController, UDPScanConfig} from '../../src/radio/radio-controller';
import {UdpResponse} from '../../src';

const UDP_DUMMY_BUFFER_1 = Buffer.from('test UDP buffer');
const UDP_DUMMY_BUFFER_2 = Buffer.from('foo bar lorem ipsum');

/**
 * Class to manage a local UDP server
 */
class UdpServer {
  private server: dgram.Socket | undefined;
  public startServer(listenPort = 3112) {
    this.server = dgram.createSocket('udp4');
    this.server.on('message', (message: Buffer, rinfo) => {
      this.server!.send(UDP_DUMMY_BUFFER_1, rinfo.port, rinfo.address);
      this.server!.send(UDP_DUMMY_BUFFER_2, rinfo.port, rinfo.address);
    });
    this.server.bind(listenPort);
  }
  public stopServer() {
    this.server?.close();
  }
}

/**
 * Tests that a UDP scan finds a simple UDP server
 * and properly returns the UDP discovery data.
 */
test.serial('udp-scan-finds-server', async t => {
  const serverPort = 3112;
  const listenPort = 3111;
  const scanConfig = new UDPScanConfig(
    'localhost',
    serverPort,
    listenPort,
    UDP_DUMMY_BUFFER_2.toString('hex')
  );
  const udpServer = new UdpServer();
  udpServer.startServer(serverPort);

  const expectedScanResults = {
    buffer: UDP_DUMMY_BUFFER_1,
    address: '127.0.0.1',
  };
  const radioController = new RadioController();
  const scanResults = await radioController.udpScan(scanConfig);
  udpServer.stopServer();
  t.deepEqual(expectedScanResults, scanResults);
});

/**
 * Tests that a `sendUDPMessage` returns with the correct
 * response packets
 */
test.serial('udp-message-recieves-all-data', async t => {
  const serverPort = 3112;
  const listenPort = 3001;
  const udpServer = new UdpServer();
  udpServer.startServer(serverPort);
  const radioController = new RadioController();
  const expectedUdpResponse = new UdpResponse([
    UDP_DUMMY_BUFFER_1.toString('hex'),
    UDP_DUMMY_BUFFER_2.toString('hex'),
  ]);
  const udpResponse = await radioController.sendUdpMessage(
    Buffer.from('nothing important'),
    'localhost',
    serverPort,
    listenPort,
    2
  );
  udpServer.stopServer();
  t.deepEqual(expectedUdpResponse, udpResponse);
});
