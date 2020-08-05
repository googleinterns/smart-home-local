import {RadioController} from './radio-controller';
import {UdpResponseData, TcpResponseData} from './dataflow';

const DEFAULT_LISTEN_PORT = 3311;

/**
 * An implementation of `smarthome.DeviceManager` that implements radio functionality.
 */
export class RadioDeviceManager implements smarthome.DeviceManager {
  private radioController: RadioController;
  private listenPort: number;
  public deviceIdToAddress: Map<string, string> = new Map<string, string>();

  constructor(
    radioHub: RadioController,
    listenPort: number = DEFAULT_LISTEN_PORT
  ) {
    this.radioController = radioHub;
    this.listenPort = listenPort;
  }

  public addDeviceIdToAddress(deviceId: string, address: string): void {
    this.deviceIdToAddress.set(deviceId, address);
  }

  markPending(request: smarthome.IntentRequest): Promise<void> {
    return Promise.resolve();
  }

  getProxyInfo(id: string): smarthome.ProxyInfo {
    //TODO(cjdaly) implementation
    throw new Error('Method not implemented.');
  }

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
      const payload = Buffer.from(tcpRequestData.data, 'hex');
      const tcpResponse = await this.radioController.writeTcpSocket(
        payload,
        localAddress!,
        port
      );
      return new TcpResponseData(requestId, deviceId, tcpResponse);
    }
  }

  private async processHttpResponseData(
    httpRequestData: smarthome.DataFlow.HttpRequestData
  ): Promise<smarthome.DataFlow.HttpRequestData> {
    throw new Error('Function not implemented');
  }

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
