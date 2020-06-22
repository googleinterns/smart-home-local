/**
 * DeviceManager Stub For local radio functionality
 * TODO remove comments from local home SDK: just here for reference from sample
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
