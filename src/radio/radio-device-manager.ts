import {RadioController} from './radio-controller';
import {UdpResponseData, HttpResponseData, TcpResponseData} from './dataflow';

/**
 * The default port to listen on for radio responses.
 */
const DEFAULT_LISTEN_PORT = 3311;

/**
 * An implementation of `smarthome.DeviceManager` that implements radio functionality.
 */
export class RadioDeviceManager implements smarthome.DeviceManager {
  private radioController: RadioController;
  private listenPort: number;
  private deviceIdToAddress: Map<string, string> = new Map<string, string>();

  /**
   * @param  radioController  The radio controller used for radio communication.
   * @param  listenPort  The port to listen on for radio responses.
   */
  constructor(
    radioController: RadioController,
    listenPort: number = DEFAULT_LISTEN_PORT
  ) {
    this.radioController = radioController;
    this.listenPort = listenPort;
  }

  /**
   * Associates a deviceId with an IP address.
   * Required for routing Execute commands.
   * @param deviceId The deviceId of the device
   * @param address The address of the device
   */
  public addDeviceIdToAddress(deviceId: string, address: string): void {
    this.deviceIdToAddress.set(deviceId, address);
  }

  markPending(request: smarthome.IntentRequest): Promise<void> {
    //TODO(cjdaly) implementation
    return Promise.resolve();
  }

  getProxyInfo(id: string): smarthome.ProxyInfo {
    //TODO(cjdaly) implementation
    throw new Error('Method not implemented.');
  }

  /**
   * Fulfills a UdpRquestData.
   * @param udpRequestData  The UdpRequestData to source radio parameters from.
   * @returns  A promise that resolves to the determined UdpResponseData.
   */
  private async processUdpRequestData(
    udpRequestData: smarthome.DataFlow.UdpRequestData
  ): Promise<smarthome.DataFlow.UdpResponseData> {
    const payload = Buffer.from(udpRequestData.data, 'hex');
    const localAddress = this.deviceIdToAddress.get(udpRequestData.deviceId);
    const udpResponse = await this.radioController.sendUdpMessage(
      payload,
      localAddress!,
      udpRequestData.port,
      this.listenPort,
      udpRequestData.expectedResponsePackets
    );
    return new UdpResponseData(
      udpRequestData.requestId,
      udpRequestData.deviceId,
      udpResponse
    );
  }

  /**
   * Fulfills a TcpRequestData.
   * @param tcpRequestData  The TcpRequestData to source radio parameters from.
   * @returns  A promise that resolves to the determined TcpResponseData.
   */
  private async processTcpRequestData(
    tcpRequestData: smarthome.DataFlow.TcpRequestData
  ): Promise<smarthome.DataFlow.TcpResponseData> {
    const localAddress = this.deviceIdToAddress.get(tcpRequestData.deviceId);
    const requestId = tcpRequestData.requestId;
    const deviceId = tcpRequestData.deviceId;
    const port = tcpRequestData.port;

    if (tcpRequestData.operation === smarthome.Constants.TcpOperation.READ) {
      const tcpResponse = await this.radioController.readTcpSocket(
        localAddress!,
        port
      );
      return new TcpResponseData(requestId, deviceId, tcpResponse);
    } else {
      // Otherwise, `smarthome.Constants.TcpOperation.WRITE`
      const payload = Buffer.from(tcpRequestData.data, 'hex');
      const tcpResponse = await this.radioController.writeTcpSocket(
        payload,
        localAddress!,
        port
      );
      return new TcpResponseData(requestId, deviceId, tcpResponse);
    }
  }

  /**
   * Fulfills an `HttpRequestData`.
   * @param httpRequestData  The `HttpRequestData` to source radio parameters from.
   * @returns  A promise that resolves to the determined `HttpResponseData`.
   */
  private async processHttpResponseData(
    httpRequestData: smarthome.DataFlow.HttpRequestData
  ): Promise<smarthome.DataFlow.HttpResponseData> {
    const address = this.deviceIdToAddress.get(httpRequestData.deviceId)!;
    let port = 80;
    if (httpRequestData.port !== undefined) {
      port = httpRequestData.port;
    }
    if (httpRequestData.method === 'GET') {
      const httpResponse = await this.radioController.sendHttpGet(
        address,
        port,
        httpRequestData.path
      );
      return new HttpResponseData(
        httpRequestData.deviceId,
        httpResponse,
        httpRequestData.requestId
      );
    } else if (httpRequestData.method === 'POST') {
      const httpResponse = await this.radioController.sendHttpPost(
        address,
        port,
        httpRequestData.path,
        httpRequestData.dataType,
        httpRequestData.data
      );
      return new HttpResponseData(
        httpRequestData.deviceId,
        httpResponse,
        httpRequestData.requestId
      );
    }
    throw new Error(`HTTP method ${httpRequestData.method} unsupported.`);
  }

  /**
   * Sends a true radio command based on the contents of a `CommandRequest`
   * @param command  The `CommandRequest` to process.
   * @returns  The determined `CommandBase` response.
   */
  public async send(
    command: smarthome.DataFlow.CommandRequest
  ): Promise<smarthome.DataFlow.CommandBase> {
    if (!this.deviceIdToAddress.has(command.deviceId)) {
      throw new smarthome.IntentFlow.HandlerError(command.requestId);
    }
    console.log(command);
    if (command.protocol === 'UDP') {
      return await this.processUdpRequestData(
        command as smarthome.DataFlow.UdpRequestData
      );
    } else if (command.protocol === 'TCP') {
      return await this.processTcpRequestData(
        command as smarthome.DataFlow.TcpRequestData
      );
    } else if (command.protocol === 'HTTP') {
      return await this.processHttpResponseData(
        command as smarthome.DataFlow.HttpRequestData
      );
    }
    throw new Error('Radio protocol not recognized');
  }
}
