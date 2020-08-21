import {
  UDPScanConfig,
  UDPScanResults,
} from '@google/local-home-testing/build/src/radio';
import {stringify} from 'querystring';

/**
 * The port to use for the proxy server and client.
 */
export const PROXY_WEBSOCKET_PORT = 4321;

/**
 * Defines all supported message types.
 */
export type RadioMessageType = 'UDPSCAN' | 'UDP' | 'TCP' | 'HTTP';

/**
 * A message request interface which demands a supported message type.
 */
export interface ProxyRequest {
  proxyMessageType: RadioMessageType;
}

/**
 * A message response interface which demands a supported message type.
 * Optionally holds an error message.
 */
export interface ProxyResponse {
  proxyMessageType: RadioMessageType | undefined;
  error: undefined | string;
}

/**
 * A class which contains all parameters required
 * to fulfill a UDP scan.
 */
export class UdpScanProxyRequest implements ProxyRequest {
  proxyMessageType: RadioMessageType = 'UDPSCAN';
  udpScanConfig: UDPScanConfig;
  /**
   * @param udpScanConfig  The UDP Scan config to scan with.
   * @returns  A new `UdpScanRequest` instance.
   */
  constructor(udpScanConfig: UDPScanConfig) {
    this.udpScanConfig = udpScanConfig;
  }
}

/**
 * A class which contains all parameters required
 * to fulfill a UDP message command.
 */
export class UdpProxyRequest implements ProxyRequest {
  proxyMessageType: RadioMessageType = 'UDP';
  address: string;
  listenPort: number;
  payload: string;
  port: number;
  expectedResponsePackets: number;
  /**
   * @param address  The destination UDP address.
   * @param listenPort  The UDP port to listen on for packets.
   * @param payload  The UDP message payload.
   * @param port  The destintion UDP port.
   * @param expectedResponsePackets  The amount of packets to listen for.
   * @returns  A new `UdpProxyRequest` instance.
   */
  constructor(
    address: string,
    listenPort: number,
    payload: string,
    port: number,
    expectedResponsePackets = 0
  ) {
    this.address = address;
    this.listenPort = listenPort;
    this.payload = payload;
    this.port = port;
    this.expectedResponsePackets = expectedResponsePackets;
  }
}

/**
 * A class which contains all parameters required
 * to fulfill a TCP message command.
 */
export class TcpProxyRequest implements ProxyRequest {
  proxyMessageType: RadioMessageType = 'TCP';
  tcpOperation: smarthome.Constants.TcpOperation;
  address: string;
  port: number;
  payload: string | undefined;
  /**
   * @param address  The destination TCP address.
   * @param listenPort  The destination TCP port.
   * @param tcpOperation  The TCP operation: either `READ` or `WRITE`.
   * @param payload  The TCP payload, required for a `WRITE`.
   * @returns  A new `TcpProxyRequest` instance.
   */
  constructor(
    address: string,
    port: number,
    tcpOperation: smarthome.Constants.TcpOperation,
    payload?: string
  ) {
    this.address = address;
    this.port = port;
    this.tcpOperation = tcpOperation;
    this.payload = payload;
  }
}

/**
 * A class which contains all parameters required
 * to fulfill a HTTP message command.
 */
export class HttpProxyRequest implements ProxyRequest {
  proxyMessageType: RadioMessageType = 'HTTP';
  httpOperation: smarthome.Constants.HttpOperation;
  host: string;
  port: number;
  path: string;
  dataType: string | undefined;
  data: string | undefined;
  /**
   * @param host  The destination HTTP address.
   * @param listenPort  The destination HTTP port.
   * @param path  The destination HTTP path.
   * @param httpOperation  The HTTP operation.
   * @param dataType  The HTTP POST datatype.
   * @param httpOperation  The HTTP POST data.
   * @returns  A new `HttpProxyRequest` instance.
   */
  constructor(
    host: string,
    port: number,
    path: string,
    httpOperation: smarthome.Constants.HttpOperation,
    dataType?: string,
    data?: string
  ) {
    this.host = host;
    this.port = port;
    this.path = path;
    this.httpOperation = httpOperation;
    this.dataType = dataType;
    this.data = data;
  }
}

/**
 * A class that contains all information for a fulfilled `UdpScanRequest`.
 */
export class UdpScanProxyResponse implements ProxyResponse {
  proxyMessageType: RadioMessageType = 'UDPSCAN';
  error: undefined | string;
  udpScanResults: UDPScanResults | undefined;
  /**
   * @param udpScanResults  The UDP scan results.
   * @param error  An error message, if any.
   * @returns  A new `UdpScanProxyResponse` instance.
   */
  constructor(udpScanResults?: UDPScanResults, error = '') {
    this.udpScanResults = udpScanResults;
    this.error = error;
  }
}

/**
 * A class that contains all information for a fulfilled `UdpProxyRequest`.
 */
export class UdpProxyResponse implements ProxyResponse {
  proxyMessageType: RadioMessageType = 'UDP';
  error: string | undefined;
  udpResponse: smarthome.DataFlow.UdpResponse | undefined;
  /**
   * @param udpResponse  The `UdpResponse` obtained from the UDP command.
   * @param error  An error message, if any.
   * @returns  A new `UdpProxyResponse` instance.
   */
  constructor(udpResponse?: smarthome.DataFlow.UdpResponse, error?: string) {
    this.udpResponse = udpResponse;
    this.error = error;
  }
}

/**
 * A class that contains all information for a fulfilled `TcpProxyRequest`.
 */
export class TcpProxyResponse implements ProxyResponse {
  proxyMessageType: RadioMessageType = 'TCP';
  error: undefined | string;
  tcpResponse: smarthome.DataFlow.TcpResponse | undefined;
  /**
   * @param tcpResponse  The `TcpResponse` obtained from the TCP command.
   * @param error  An error message, if any.
   * @returns  A new `TcpProxyResponse` instance.
   */
  constructor(tcpResponse?: smarthome.DataFlow.TcpResponse, error?: string) {
    this.tcpResponse = this.tcpResponse;
    this.error = error;
  }
}

/**
 * A class that contains all information for a fulfilled `UdpProxyRequest`.
 */
export class HttpProxyResponse implements ProxyResponse {
  proxyMessageType: RadioMessageType = 'HTTP';
  error: undefined | string;
  httpResponse: smarthome.DataFlow.HttpResponse | undefined;
  /**
   * @param httpResponse  The `HttpResponse` obtained from the HTTP command.
   * @param error  An error message, if any.
   * @returns  A new `HttpProxyResponse` instance.
   */
  constructor(httpResponse?: smarthome.DataFlow.HttpResponse, error?: string) {
    this.httpResponse = this.httpResponse;
    this.error = error;
  }
}
