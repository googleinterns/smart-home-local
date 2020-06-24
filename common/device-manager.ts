/**
 * DeviceManager Stub
 * TODO(cjdaly) integrate with Mock Local Home Platform and Mock Network
 **/

// <reference types="@google/local-home-sdk" />
import * as smarthome from '@google/local-home-sdk';

class DeviceManager {
  deviceId: string;
  error: boolean;
  public commands = new Array<smarthome.DataFlow.TcpRequestData>();

  constructor(mockNetwork: MockNetwork) {
    this.mockNetwork = mockNetwork;
  }

  public send(
    command: smarthome.DataFlow.TcpRequestData
  ): Promise<smarthome.DataFlow.CommandSuccess> {
    if (this.error) {
      return Promise.reject(this.error);
    }
    this.commands.push(command);
    //TODO(cjdaly) build a proper CommandSuccess
    return Promise.resolve(new smarthome.DataFlow.HttpRequestData());
  }

  public markPending(request: any): Promise<void> {
    return Promise.resolve();
  }
  public getProxyInfo(id: string): any {
    return {};
  }
};
