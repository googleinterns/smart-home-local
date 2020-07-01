/**
 * DeviceManager Stub
 * TODO(cjdaly) integrate with Mock Local Home Platform and Mock Network
 **/
/// <reference types="@google/local-home-sdk" />
import { MockNetwork } from './mock-radio';

export class DeviceManagerStub implements smarthome.DeviceManager {
  deviceId: string;
  error: boolean;
  commands: smarthome.DataFlow.TcpRequestData[] = [];

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

  markPending(request: smarthome.IntentRequest): Promise<void> {
    //TODO(cjdaly) implementation
    throw new Error('Method not implemented.');
  }

  getProxyInfo(id: string): smarthome.ProxyInfo {
    //TODO(cjdaly) implementation
    throw new Error('Method not implemented.');
  }
}
