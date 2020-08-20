import * as net from 'net';
import test from 'ava';
import * as dgram from 'dgram';
import {RadioController, UDPScanConfig} from '../../src/radio/radio-controller';
import {UdpResponse, TcpResponse} from '../../src';

const UDP_PLACEHOLDER_BUFFER_1 = Buffer.from('test UDP buffer');
const UDP_PLACEHOLDER_BUFFER_2 = Buffer.from('foo bar lorem ipsum');

const TCP_PLACEHOLDER_BUFFER = Buffer.from('placeholder data');

/**
 * Class to manage a local UDP server
 */
class UdpServer {
  private server: dgram.Socket | undefined;
  public startServer(listenPort = 3112) {
    this.server = dgram.createSocket('udp4');
    this.server.on('message', (message: Buffer, rinfo) => {
      this.server!.send(UDP_PLACEHOLDER_BUFFER_1, rinfo.port, rinfo.address);
      this.server!.send(UDP_PLACEHOLDER_BUFFER_2, rinfo.port, rinfo.address);
    });
    this.server.bind(listenPort);
  }
  public stopServer() {
    this.server?.close();
  }
}

/**
 * Class to manage a simple TCP server for testing.
 */
class TcpServer {
  private server: net.Server | undefined;
  private onDataRecieved: ((data: Buffer) => void) | undefined;

  /**
   * Starts a simple TCP server that writes and recieves data from a socket.
   * @param listenPort  The port to listen on.
   */
  public startServer(listenPort = 3312): void {
    this.server = net.createServer(socket => {
      socket.write(TCP_PLACEHOLDER_BUFFER);
      socket.on('data', data => {
        if (this.onDataRecieved !== undefined) {
          this.onDataRecieved(data);
        }
      });
    });
    this.server.listen(listenPort);
  }

  /**
   * Returns the next buffer written to the server.
   * @returns  A promise that resolves to the next data buffer recieved.
   */
  public async getWrittenData(): Promise<Buffer> {
    return new Promise(resolve => {
      this.onDataRecieved = (data: Buffer) => {
        resolve(data);
      };
    });
  }

  /**
   * Closes the TCP server, if possible.
   */
  public closeServer(): void {
    this.server?.close();
  }
}

/*
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
    UDP_PLACEHOLDER_BUFFER_2.toString('hex')
  );
  const udpServer = new UdpServer();
  udpServer.startServer(serverPort);

  const expectedScanResults = {
    buffer: UDP_PLACEHOLDER_BUFFER_1,
    rinfo: {
      address: '127.0.0.1',
      family: 'IPv4',
      port: serverPort,
      size: 15,
    },
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
    UDP_PLACEHOLDER_BUFFER_1.toString('hex'),
    UDP_PLACEHOLDER_BUFFER_2.toString('hex'),
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
/**
 * Tests that `readTcpSocket()` is able to read data from a TCP server.
 */
test.serial('tcp-read-operation-reads-from-server', async t => {
  const serverPort = 3312;
  const tcpServer = new TcpServer();
  tcpServer.startServer(serverPort);
  const radioController = new RadioController();
  const expectedTcpResponse = new TcpResponse(
    TCP_PLACEHOLDER_BUFFER.toString('hex')
  );
  const actualTcpResponse = await radioController.readTcpSocket(
    'localhost',
    serverPort
  );
  tcpServer.closeServer();
  t.deepEqual(actualTcpResponse, expectedTcpResponse);
});

/**
 * Tests that `writeTcpSocket()` is able to write data to a TCP server.
 */
test.serial('tcp-write-operation-writes-data', async t => {
  const serverPort = 3312;
  const tcpServer = new TcpServer();
  tcpServer.startServer(serverPort);
  const radioController = new RadioController();
  const expectedTcpResponse = new TcpResponse();
  const actualTcpResponse = await radioController.writeTcpSocket(
    TCP_PLACEHOLDER_BUFFER,
    'localhost',
    serverPort
  );
  tcpServer.closeServer();
  t.deepEqual(actualTcpResponse, expectedTcpResponse);
  t.deepEqual(await tcpServer.getWrittenData(), TCP_PLACEHOLDER_BUFFER);
});
