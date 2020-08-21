import WebSocket, * as ws from 'ws';
import {
  PROXY_WEBSOCKET_PORT,
  ProxyRequest,
  UdpProxyRequest,
  UdpScanProxyRequest,
  UdpScanProxyResponse,
  UdpProxyResponse,
  TcpProxyRequest,
  HttpProxyResponse,
  HttpProxyRequest,
  TcpProxyResponse,
} from '../common/proxy-comms';
import {NodeRadioController} from '@google/local-home-testing/build/src/radio/node-radio-controller';
import {smarthomeStub} from '@google/local-home-testing';

/** Loads stubs */
(global as any).smarthome = smarthomeStub;

/**
 * A WebSocket server that runs on node to provide radio fulfillment.
 * Uses the `NodeRadioController` implementation to fulfill requests.
 */
export class ProxyRadioServer {
  private webSocketServer: ws.Server;
  private nodeRadioController: NodeRadioController;

  constructor() {
    this.webSocketServer = new ws.Server({port: PROXY_WEBSOCKET_PORT});
    // Instantiate a radio controller.
    this.nodeRadioController = new NodeRadioController();
    /**
     * Handle connection and message events.
     */
    this.webSocketServer.on('connection', socket => {
      console.log('Connection established');
      socket.on('message', async message => {
        console.log(`Received ${message}`);
        const radioMessage: ProxyRequest = JSON.parse(message as string);
        // Route messages to corresponding message handlers.
        switch (radioMessage.proxyMessageType) {
          case 'UDPSCAN': {
            this.handleUdpScanRequest(
              radioMessage as UdpScanProxyRequest,
              socket
            );
            break;
          }
          case 'UDP': {
            this.handleUdpRequest(radioMessage as UdpProxyRequest, socket);
            break;
          }
          case 'TCP': {
            this.handleTcpRequest(radioMessage as TcpProxyRequest, socket);
            break;
          }
          case 'HTTP': {
            this.handleHttpRequest(radioMessage as HttpProxyRequest, socket);
            break;
          }
        }
      });
    });
  }

  /**
   * Uses the internal `NodeRadioController` to fulfill the UDP scan request.
   * Formats the response and sends it across the socket.
   * @param udpScanProxyRequest  A `UdpScanProxyRequest` to fulfill and respond to.
   * @param socket  The socket to respond on.
   */
  private async handleUdpScanRequest(
    udpScanProxyRequest: UdpScanProxyRequest,
    socket: WebSocket
  ): Promise<void> {
    try {
      const udpScanResponse = new UdpScanProxyResponse(
        await this.nodeRadioController.udpScan(
          udpScanProxyRequest.udpScanConfig
        )
      );
      socket.send(JSON.stringify(udpScanResponse));
    } catch (error) {
      const errorResponse = new UdpScanProxyResponse(undefined, error.message);
      socket.send(JSON.stringify(errorResponse));
    }
  }

  /**
   * Uses the internal `NodeRadioController` to fulfill the UDP message request.
   * Formats the response and sends it across the socket.
   * @param udpProxyRequest  A `UdpProxyRequest` request to fulfill and respond to.
   * @param socket  The socket to respond on.
   */
  private async handleUdpRequest(
    udpProxyRequest: UdpProxyRequest,
    socket: WebSocket
  ): Promise<void> {
    try {
      const udpProxyResponse = new UdpProxyResponse(
        await this.nodeRadioController.sendUdpMessage(
          Buffer.from(udpProxyRequest.payload, 'hex'),
          udpProxyRequest.address,
          udpProxyRequest.port,
          udpProxyRequest.listenPort
        )
      );
      socket.send(JSON.stringify(udpProxyResponse));
    } catch (error) {
      const errorResponse = new UdpProxyResponse(undefined, error.message);
      socket.send(JSON.stringify(errorResponse));
    }
  }

  /**
   * Uses the internal `NodeRadioController` to fulfill the TCP message request.
   * Formats the response and sends it across the socket.
   * @param tcpProxyRequest  A `TcpProxyRequest` request to fulfill and respond to.
   * @param socket  The socket to respond on.
   */
  private async handleTcpRequest(
    tcpProxyRequest: TcpProxyRequest,
    socket: WebSocket
  ): Promise<void> {
    try {
      if (
        tcpProxyRequest.tcpOperation ==
        global.smarthome.Constants.TcpOperation.READ
      ) {
        const tcpProxyResponse = new TcpProxyResponse(
          await this.nodeRadioController.readTcpSocket(
            tcpProxyRequest.address,
            tcpProxyRequest.port
          )
        );
        socket.send(JSON.stringify(tcpProxyResponse));
      } else {
        //Otherwise, smarthome.Constants.TcpOperation.WRITE
        const tcpProxyResponse = new TcpProxyResponse(
          await this.nodeRadioController.writeTcpSocket(
            Buffer.from(tcpProxyRequest.payload!, 'hex'),
            tcpProxyRequest.address,
            tcpProxyRequest.port
          )
        );
        socket.send(JSON.stringify(tcpProxyResponse));
      }
    } catch (error) {
      const errorResponse = new TcpProxyResponse(undefined, error.message);
      socket.send(JSON.stringify(errorResponse));
      throw error;
    }
  }

  /**
   * Uses the internal `NodeRadioController` to fulfill the TCP message request.
   * Formats the response and sends it across the socket.
   * @param httpProxyRequest  A `HttpProxRequest` request to fulfill and respond to.
   * @param socket  The socket to respond on.
   */
  private async handleHttpRequest(
    httpProxyRequest: HttpProxyRequest,
    socket: WebSocket
  ): Promise<void> {
    try {
      if (
        httpProxyRequest.httpOperation ==
        global.smarthome.Constants.HttpOperation.GET
      ) {
        const httpProxyResponse = new HttpProxyResponse(
          await this.nodeRadioController.sendHttpGet(
            httpProxyRequest.host,
            httpProxyRequest.port,
            httpProxyRequest.path
          )
        );
        socket.send(JSON.stringify(httpProxyResponse));
      } else {
        //Otherwise, smarthome.Constants.HttpOperation.POST
        const httpProxyResponse = new HttpProxyResponse(
          await this.nodeRadioController.sendHttpPost(
            httpProxyRequest.host,
            httpProxyRequest.port,
            httpProxyRequest.path,
            httpProxyRequest.dataType!,
            httpProxyRequest.data!
          )
        );
        socket.send(JSON.stringify(httpProxyResponse));
      }
    } catch (error) {
      const errorResponse = new HttpProxyResponse(undefined, error.message);
      socket.send(JSON.stringify(errorResponse));
    }
  }
}
