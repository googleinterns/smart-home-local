/**
 * DeviceManager Stub
 * TODO(cjdaly) integrate with Mock Local Home Platform and Mock Network
 **/
/// <reference types="@google/local-home-sdk" />

export class DeviceManagerStub implements smarthome.DeviceManager {
  // Map of expected requests to responses
  private expectedCommandToResponse: Map<
    smarthome.DataFlow.TcpRequestData,
    smarthome.DataFlow.TcpResponseData
  > = new Map();

  public addExpectedRequest(
    expectedCommand: smarthome.DataFlow.TcpRequestData,
    response: smarthome.DataFlow.TcpResponseData
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

export enum ControlKind {
  UDP = 'UDP',
}

export function makeSendCommand(protocol: ControlKind, buf: Buffer) {
  switch (protocol) {
    case ControlKind.UDP:
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
