import * as net from 'net';
import test from 'ava';
import * as dgram from 'dgram';
import * as http from 'http';
import {
  NodeRadioController,
  UdpResponse,
  TcpResponse,
  UDPScanConfig,
  HttpResponse,
} from '../../src/radio';

const UDP_PLACEHOLDER_BUFFER_1 = Buffer.from('test UDP buffer');
const UDP_PLACEHOLDER_BUFFER_2 = Buffer.from('foo bar lorem ipsum');

const TCP_PLACEHOLDER_BUFFER = Buffer.from('placeholder data');

const HTTP_SERVER_CHUNKS_1 = [
  '<body>',
  'I ',
  ' am',
  ' a',
  ' server.',
  '</body>',
];
const HTTP_SERVER_CHUNKS_2 = [
  '<body>',
  'Thanks ',
  'for ',
  'the ',
  'data.',
  '</body>',
];
const HTTP_SERVER_ENDPOINT_PATH = '/sample';

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

/**
 * Class to manage a simple HTTP server for testing GET and POST
 */
class HttpServer {
  private server: http.Server | undefined;
  private onChunkWritten: (chunk: Buffer) => void = () => {};

  /**
   * Starts the HTTP server.
   * Listens on two paths for GET and POST requests.
   * @param listenPort  The port to start the server on.
   */
  public startServer(listenPort = 5000) {
    this.server = http.createServer((request, response) => {
      if (request.url === '/') {
        response.writeHead(200);
        HTTP_SERVER_CHUNKS_1.forEach(chunk => {
          response.write(chunk);
        });
        response.end();
      } else if (request.url === HTTP_SERVER_ENDPOINT_PATH) {
        request.on('data', chunk => {
          this.onChunkWritten(chunk);
        });
        response.writeHead(200);
        HTTP_SERVER_CHUNKS_2.forEach(chunk => {
          response.write(chunk);
        });
        response.end();
      }
    });
    this.server.listen(listenPort);
  }

  /**
   * Gets the next chunk written to the HTTP server's POST endpoint.
   * @returns  A promise that resolves to a utf8-encoded `Buffer`.
   */
  public async getNextChunkWritten(): Promise<Buffer> {
    return new Promise<Buffer>(resolve => {
      this.onChunkWritten = (chunk: Buffer) => {
        resolve(chunk);
      };
    });
  }

  /**
   * Closes the HTTP server, if possible.
   */
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
    UDP_PLACEHOLDER_BUFFER_2.toString('hex')
  );
  const udpServer = new UdpServer();
  udpServer.startServer(serverPort);

  const expectedScanResults = {
    scanData: UDP_PLACEHOLDER_BUFFER_1.toString('hex'),
    rinfo: {
      address: '127.0.0.1',
      family: 'IPv4',
      port: serverPort,
      size: 15,
    },
  };
  const radioController = new NodeRadioController();
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
  const radioController = new NodeRadioController();
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
  const radioController = new NodeRadioController();
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
  const radioController = new NodeRadioController();
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

/**
 * Tests that an HTTP GET request returns the expected body.
 */
test.serial('http-get-returns-body', async t => {
  const serverPort = 5000;
  const httpServer = new HttpServer();
  httpServer.startServer(serverPort);

  const expectedHttpResponse = new HttpResponse(
    HTTP_SERVER_CHUNKS_1.join(''),
    200
  );
  const radioController = new NodeRadioController();
  const httpResponse = await radioController.sendHttpGet(
    'localhost',
    serverPort,
    '/'
  );
  httpServer.stopServer();
  t.deepEqual(expectedHttpResponse, httpResponse);
});

/**
 * Tests that an HTTP POST request can write data to a server.
 * Tests that an HTTP POST returns the expected body.
 */
test.serial('http-post-writes-data-and-returns-body', async t => {
  const serverPort = 5000;
  const httpServer = new HttpServer();
  httpServer.startServer(serverPort);
  const sampleJSON = JSON.stringify({
    foo: 'This is some arbitrary data.',
    bar: 'This is also data.',
  });
  const expectedHttpResponse = new HttpResponse(
    HTTP_SERVER_CHUNKS_2.join(''),
    200
  );
  const radioController = new NodeRadioController();
  const nextChunk = httpServer.getNextChunkWritten();
  const httpResponse = await radioController.sendHttpPost(
    'localhost',
    serverPort,
    HTTP_SERVER_ENDPOINT_PATH,
    'application/json',
    sampleJSON
  );
  httpServer.stopServer();
  t.deepEqual(expectedHttpResponse, httpResponse);
  t.deepEqual((await nextChunk).toString('utf8'), sampleJSON);
});
