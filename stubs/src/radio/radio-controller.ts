import {UDPScanConfig, UDPScanResults} from './dataflow';

/**
 * An interface to fulfill radio functionality.
 */
export interface RadioController {
  /**
   * Performs a UDP scan according to a `UDPScanConfig`.
   * @param udpScanConfig  A scan configuration containing UDP parameters.
   * @param timeout  How long in ms to wait before timing out the request.
   * @return  A promise that resolves to the determined `UDPScanResults`
   */
  udpScan(
    udpScanConfig: UDPScanConfig,
    timeout?: number
  ): Promise<UDPScanResults>;

  /**
   * Sends a UDP message using the given parameters
   * @param payload  The payload to send in the UDP message.
   * @param address  The destination address of the UDP message.
   * @param listenPort  The port to listen on for a response, if execting one.
   * @param expectedResponsePackets  The number of responses to save before resolving.
   * @param timeout  How long in ms to wait before timing out the request.
   * @returns  A promise that resolves to the determined `UDPResponse`.
   */
  sendUdpMessage(
    payload: Buffer,
    address: string,
    port: number,
    listenPort: number,
    expectedResponsePackets?: number,
    timeout?: number
  ): Promise<smarthome.DataFlow.UdpResponse>;

  /**
   * Reads data from a TCP socket.
   * @param address  The address to open a TCP socket on.
   * @param port  The port to open a TCP socket on.
   * @param timeout  How long in ms to wait before timing out the request.
   * @returns  The data read from the TCP socket.
   */
  readTcpSocket(
    address: string,
    port: number,
    timeout?: number
  ): Promise<smarthome.DataFlow.TcpResponse>;

  /**
   * Sends an HTTP GET request using the provided parameters.
   * @param host  The address to send the HTTP GET request to.
   * @param port  The port to send the HTTP GET request to.
   * @param path  The path to send the HTTP GET request to.
   * @param timeout  How long to wait before rejecting with a timeout.
   */
  sendHttpGet(
    host: string,
    port: number,
    path: string,
    timeout?: number
  ): Promise<smarthome.DataFlow.HttpResponse>;

  /**
   * Open a TCP socket and write to it.
   * @param payload  The payload to send in the TCP write.
   * @param address  The address to write to.
   * @param port  The port to write to.
   * @param timeout  How long in ms to wait before timing out the request.
   * @returns  A promise that resolves to the determined `TcpResponse`.
   */
  writeTcpSocket(
    payload: Buffer,
    address: string,
    port: number,
    timeout?: number
  ): Promise<smarthome.DataFlow.TcpResponse>;

  /**
   * Sends an HTTP POST request using the provided parameters.
   * @param host  The address to send the HTTP POST request to.
   * @param port  The port to send the HTTP POST request to.
   * @param path  The path to send the HTTP POST request to.
   * @param timeout  How long to wait before rejecting with a timeout.
   */
  sendHttpPost(
    host: string,
    port: number,
    path: string,
    dataType: string,
    data: string,
    timeout?: number
  ): Promise<smarthome.DataFlow.HttpResponse>;
}
