/**
 * DeviceManager Stub
 * TODO(cjdaly) integrate with Mock Local Home Platform and Mock Network
 **/
/// <reference types="@google/local-home-sdk" />
export class DeviceManagerStub implements smarthome.DeviceManager {
  private markPendingAction:
    | ((request: smarthome.IntentRequest) => void)
    | undefined;
  private expectedCommandToResponse: Map<
    smarthome.DataFlow.CommandRequest,
    smarthome.DataFlow.CommandSuccess
  > = new Map();

  public doesNextPendingRequestMatch(
    requestToMatch: smarthome.IntentRequest
  ): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      this.markPendingAction = (pendingRequest: smarthome.IntentRequest) => {
        resolve(pendingRequest === requestToMatch);
      };
    });
  }

  public addExpectedCommand(
    expectedCommand: smarthome.DataFlow.CommandRequest,
    response: smarthome.DataFlow.CommandBase
  ): void {
    this.expectedCommandToResponse.set(expectedCommand, response);
  }

  markPending(request: smarthome.IntentRequest): Promise<void> {
    if (this.markPendingAction !== undefined) {
      this.markPendingAction(request);
    }
    return Promise.resolve();
  }

  getProxyInfo(id: string): smarthome.ProxyInfo {
    throw new Error('Method not implemented.');
  }

  public send(
    command: smarthome.DataFlow.CommandRequest
  ): Promise<smarthome.DataFlow.CommandSuccess> {
    if (this.expectedCommandToResponse.has(command)) {
      return Promise.resolve(this.expectedCommandToResponse.get(command)!);
    }
    throw new smarthome.IntentFlow.HandlerError(command.requestId);
  }
}
