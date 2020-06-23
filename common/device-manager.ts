/**
 * DeviceManager Stub
 * TODO(cjdaly) integrate with Mock Local Home Platform and Mock Network
 **/
/// <reference types="@google/local-home-sdk" />

export const DeviceManagerStub = class {
  deviceId: string;
  error: boolean;
  public commands = new Array<smarthome.DataFlow.TcpRequestData>();

  public send(command: smarthome.DataFlow.TcpRequestData): Promise<any> {
    if (this.error) {
      return Promise.reject(this.error);
    }
    this.commands.push(command);
    return Promise.resolve(this.deviceId);
  }
}
