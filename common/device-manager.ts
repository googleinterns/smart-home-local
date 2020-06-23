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

  /**
   * `send` is called by app when it needs to communicate with a device.
   * Depending upon the protocol used by the device, the app constructs a
   * [[DataFlow.CommandRequest]] object and passes it as an argument.
   * Returns a promise that resolves to [[DataFlow.CommandSuccess]]. Response
   * may return data, if it was a read request.
   * @param command  Command to communicate with the device.
   * @return  Promise that resolves to [[DataFlow.CommandSuccess]]
   **/

  public send(command: smarthome.DataFlow.TcpRequestData): Promise<any> {
    if (this.error) {
      return Promise.reject(this.error);
    }
    this.commands.push(command);
    return Promise.resolve(this.deviceId);
  }
}
/**
 * Stub function
 **/

export function deviceManagerStub(deviceId: string, error?: any) {
  const deviceManager = new DeviceManager();
  deviceManager.deviceId = deviceId;
  deviceManager.error = error;
  return deviceManager;
}
