/**
 * DeviceManager Stub
 * TODO(cjdaly) integrate with Mock Local Home Platform and Mock Network
 **/
/// <reference types="@google/local-home-sdk" />

export enum Protocol{
  UDP = 'UDP',
  HTTP = 'HTTP',
  TCP = 'TCP',
}

export class UdpResponseData implements smarthome.DataFlow.UdpResponseData {
  constructor(requestId: string, deviceId: string) {
    this.requestId = requestId;
    this.deviceId = deviceId;
  }
  requestId: string;
  deviceId: string;
  protocol: Protocol = Protocol.UDP;
}

export class DeviceManagerStub implements smarthome.DeviceManager {
  private expectedCommandToResponse: Map<
    smarthome.DataFlow.Command,
    smarthome.DataFlow.CommandBase
  > = new Map();

  public addExpectedCommand(
    expectedCommand: smarthome.DataFlow.Command,
    response: smarthome.DataFlow.CommandBase
  ): void {
    this.expectedCommandToResponse.set(expectedCommand, response);
  }

  markPending(request: smarthome.IntentRequest): Promise<void> {
    throw new Error('Method not implemented.');
  }

  getProxyInfo(id: string): smarthome.ProxyInfo {
    //TODO(cjdaly) implementation
    throw new Error('Method not implemented.');
  }

  public send(
    command: smarthome.DataFlow.TcpRequestData
  ): Promise<smarthome.DataFlow.CommandSuccess> {
    if (this.expectedCommandToResponse.has(command)) {
      return Promise.resolve(this.expectedCommandToResponse.get(command)!);
    }
    return Promise.reject(
      new smarthome.IntentFlow.HandlerError(command.requestId)
    );
  }
}

export function makeSendCommand(protocol: Protocol, buf: Buffer) {
  switch (protocol) {
    case Protocol.UDP:
      return makeUdpSend(buf);
    default:
      throw Error(`Unsupported protocol for send: ${protocol}`);
  }
}
function makeUdpSend(buf: Buffer) {
  const command = new smarthome.DataFlow.UdpRequestData();
  command.data = buf.toString('hex');
  return command;
}
