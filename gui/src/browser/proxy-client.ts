import {
  RadioController,
  UDPScanConfig,
  UDPScanResults,
} from '@google/local-home-testing/build/src/radio';
import {
  UdpScanProxyRequest,
  UdpProxyRequest,
  UdpProxyResponse,
  UdpScanProxyResponse,
  PROXY_WEBSOCKET_PORT,
  TcpProxyResponse,
  HttpProxyResponse,
  TcpProxyRequest,
  HttpProxyRequest,
} from '../common/proxy-comms';
import {ProxyResponse} from '../common/proxy-comms';

type ProxyResponseAction<T> = (response: T) => void;

/**
 * An implementation of `RadioController` that feeds radio requests over
 * a WebSocket connection to a `ProxyRadioServer` which fulfills
 * radio commands and replies with the results.
 */
export class ProxyRadioClient implements RadioController {
  private webSocket: WebSocket;
  private onUdpScanResponse:
    | ProxyResponseAction<UdpScanProxyResponse>
    | undefined;
  private onUdpResponse: ProxyResponseAction<UdpProxyResponse> | undefined;
  private onTcpResponse: ProxyResponseAction<TcpProxyResponse> | undefined;
  private onHttpResponse: ProxyResponseAction<HttpProxyResponse> | undefined;

  /**
   * Establishes the local WebSocket connection.
   * @returns  A new `ProxyRadioClient` instance.
   */
  constructor() {
    this.webSocket = new WebSocket(`ws://localhost:${PROXY_WEBSOCKET_PORT}`);
    this.webSocket.onopen = event => {
      console.log('Connection established with proxy server.')!;
    };
    this.webSocket.onmessage = event => {
      this.handleMessageEvent(event);
    };
  }

  /**
   * Handles `WebSocket` messages as responses to radio requests.
   * @param event  The message event to handle.
   */
  private handleMessageEvent(event: MessageEvent) {
    const response: ProxyResponse = JSON.parse(event.data as string);
    if (response.error) {
      console.error(
        `A radio request of type ${response.proxyMessageType} returned with an error:\n${response.error}`
      );
    }
    switch (response.proxyMessageType) {
      case 'UDPSCAN': {
        if (this.onUdpScanResponse) {
          this.onUdpScanResponse(response as UdpScanProxyResponse);
        }
        // Clear the response callback.
        this.onUdpScanResponse = undefined;
        break;
      }
      case 'UDP': {
        if (this.onUdpResponse) {
          this.onUdpResponse(response as UdpProxyResponse);
        }
        this.onUdpResponse = undefined;
        break;
      }
      case 'TCP': {
        if (this.onTcpResponse) {
          this.onTcpResponse(response as TcpProxyResponse);
        }
        this.onTcpResponse = undefined;
        break;
      }
      case 'HTTP': {
        if (this.onHttpResponse) {
          this.onHttpResponse(response as HttpProxyResponse);
        }
        this.onHttpResponse = undefined;
        break;
      }
    }
  }

  /**
   * Sends a `UdpScanRequest` over the WebSocket connection
   * and resolves with the response.
   * @param udpScanConfig  A struct containing a UDP scan config.
   * @returns  A promise that resolves to the `UDPScanResults`.
   */
  async udpScan(udpScanConfig: UDPScanConfig): Promise<UDPScanResults> {
    const scanRequest = new UdpScanProxyRequest(udpScanConfig);
    if (this.onUdpScanResponse) {
      throw new Error(
        'Cannot start a new UDP scan: another UDP scan is in progress.'
      );
    }
    //TODO(cjdaly) Timeout this promise.
    return new Promise<UDPScanResults>(resolve => {
      this.onUdpScanResponse = (udpScanResponse: UdpScanProxyResponse) => {
        resolve(udpScanResponse.udpScanResults);
      };
      this.webSocket.send(JSON.stringify(scanRequest));
    });
  }

  /**
   * Sends a `UdpProcyRequest` over the WebSocket connection
   * and resolves with the response.
   * @param payload  The UDP message payload.
   * @param address  The UDP destination address.
   * @param port  The UDP destination port.
   * @param listenPort  The UDP port to listen on.
   * @param expectedResponsePackets  The amount of response packets to listen for.
   */
  sendUdpMessage(
    payload: Buffer,
    address: string,
    port: number,
    listenPort: number,
    expectedResponsePackets?: number | undefined
  ): Promise<smarthome.DataFlow.UdpResponse> {
    if (this.onUdpResponse) {
      throw new Error(
        'Cannot start new UDP request: another UDP request is in progress.'
      );
    }
    const sendRequest = new UdpProxyRequest(
      address,
      listenPort,
      Buffer.from(payload).toString('hex'),
      port,
      expectedResponsePackets
    );
    //TODO(cjdaly) Timeout this promise.
    return new Promise<smarthome.DataFlow.UdpResponse>(resolve => {
      this.onUdpResponse = (udpProxyResponse: UdpProxyResponse) => {
        resolve(udpProxyResponse.udpResponse);
      };
      this.webSocket.send(JSON.stringify(sendRequest));
    });
  }

  /**
   * Sends a `TcpProxyRequest` with a `READ` operation
   * over the WebSocket connection and resolves with the response.
   * @param address  The TCP destination address.
   * @param port  The TCP destination port.
   */
  readTcpSocket(
    address: string,
    port: number,
    timeout?: number | undefined
  ): Promise<smarthome.DataFlow.TcpResponse> {
    if (this.onTcpResponse) {
      throw new Error(
        'Cannot start new UDP request: another UDP request is in progress.'
      );
    }
    const tcpRequest = new TcpProxyRequest(
      address,
      port,
      smarthome.Constants.TcpOperation.READ
    );
    //TODO(cjdaly) Timeout this promise.
    return new Promise<smarthome.DataFlow.TcpResponse>(resolve => {
      this.onTcpResponse = (tcpProxyResponse: TcpProxyResponse) => {
        resolve(tcpProxyResponse.tcpResponse);
      };
      this.webSocket.send(JSON.stringify(tcpRequest));
    });
  }

  /**
   * Sends a `TcpProxyRequest` with a `WRITE` operation
   * over the WebSocket connection and resolves with the response.
   * @param payload  the TCP message payload.
   * @param address  The TCP destination address.
   * @param port  The TCP destination port.
   */
  writeTcpSocket(
    payload: Buffer,
    address: string,
    port: number,
    timeout?: number | undefined
  ): Promise<smarthome.DataFlow.TcpResponse> {
    if (this.onTcpResponse) {
      throw new Error(
        'Cannot start new TCP request: another TCP request is in progress.'
      );
    }
    const tcpRequest = new TcpProxyRequest(
      address,
      port,
      smarthome.Constants.TcpOperation.WRITE,
      payload.toString('hex')
    );
    //TODO(cjdaly) Timeout this promise.
    return new Promise<smarthome.DataFlow.TcpResponse>(resolve => {
      this.onTcpResponse = (tcpProxyResponse: TcpProxyResponse) => {
        resolve(tcpProxyResponse.tcpResponse);
      };
      this.webSocket.send(JSON.stringify(tcpRequest));
    });
  }

  /**
   * Sends a `HttpProxyRequest` with a `GET` operation
   * over the WebSocket connection and resolves with the response.
   * @param host  The HTTP destination address.
   * @param port  The HTTP destination path.
   * @param path  The HTTP destination path.
   */
  sendHttpGet(
    host: string,
    port: number,
    path: string,
    timeout?: number | undefined
  ): Promise<smarthome.DataFlow.HttpResponse> {
    if (this.onHttpResponse) {
      throw new Error(
        'Cannot start new HTTP request: another HTTP request is in progress.'
      );
    }
    const httpRequest = new HttpProxyRequest(
      host,
      port,
      path,
      smarthome.Constants.HttpOperation.GET
    );
    //TODO(cjdaly) Timeout this promise.
    return new Promise<smarthome.DataFlow.HttpResponse>(resolve => {
      this.onHttpResponse = (httpProxyResponse: HttpProxyResponse) => {
        resolve(httpProxyResponse.httpResponse);
      };
      this.webSocket.send(JSON.stringify(httpRequest));
    });
  }

  /**
   * Sends a `HttpProxyRequest` with a `POST` operation
   * over the WebSocket connection and resolves with the response.
   * @param host  The HTTP destination address.
   * @param port  The HTTP destination path.
   * @param path  The HTTP destination path.
   * @param dataType  The `dataType` of the HTTP POST `data`.
   * @param data  The HTTP POST `data`.
   */
  sendHttpPost(
    host: string,
    port: number,
    path: string,
    dataType: string,
    data: string,
    timeout?: number | undefined
  ): Promise<smarthome.DataFlow.HttpResponse> {
    if (this.onHttpResponse) {
      throw new Error(
        'Cannot start new HTTP request: another HTTP request is in progress.'
      );
    }
    const httpRequest = new HttpProxyRequest(
      host,
      port,
      path,
      smarthome.Constants.HttpOperation.POST,
      dataType,
      data
    );
    //TODO(cjdaly) Timeout this promise.
    return new Promise<smarthome.DataFlow.HttpResponse>(resolve => {
      this.onHttpResponse = (httpProxyResponse: HttpProxyResponse) => {
        resolve(httpProxyResponse.httpResponse);
      };
      this.webSocket.send(JSON.stringify(httpRequest));
    });
  }
}
