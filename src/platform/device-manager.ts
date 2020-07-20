/**
 * DeviceManager Stub
 * TODO(cjdaly) integrate with Mock Local Home Platform and Mock Network
 **/
/// <reference types="@google/local-home-sdk" />
export class DeviceManagerStub implements smarthome.DeviceManager {
  /** Action to call when an `IntentRequest` is marked with `markPending()` */
  private markPendingAction:
    | ((request: smarthome.IntentRequest) => void)
    | undefined;
  /** Map of each expected `CommandRequest` to its associated response*/
  private expectedCommandToResponse: Map<
    smarthome.DataFlow.CommandRequest,
    smarthome.DataFlow.CommandBase
  > = new Map();

  /**
   * Checks if the next request marked pending matches a given request.
   * @param requestToMatch  A request to test against the next request marked pending.
   * @returns  Promise that resolves to a boolean representing if the requests matched.
   */
  public doesNextPendingRequestMatch(
    requestToMatch: smarthome.IntentRequest
  ): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      this.markPendingAction = (pendingRequest: smarthome.IntentRequest) => {
        resolve(pendingRequest === requestToMatch);
      };
    });
  }

  /**
   * Registers a command that will be checked on `send()` anCommd a corresponding
   * response that will be returned from `send()` on a successful match.
   * @param expectedCommand  The command to check against incoming commands.
   * @param response  The response to send when an incoming command matches.
   */
  public addExpectedCommand(
    expectedCommand: smarthome.DataFlow.CommandRequest,
    response: smarthome.DataFlow.CommandBase
  ): void {
    this.expectedCommandToResponse.set(expectedCommand, response);
  }

  /**
   * Marks a request as pending, conceptually indicating to the platform
   * that the actual operation is still not done.
   * Passes the request to `markPendingAction`
   * @param request  The request to pass into `markPendingAction`
   */
  markPending(request: smarthome.IntentRequest): Promise<void> {
    if (this.markPendingAction !== undefined) {
      this.markPendingAction(request);
    }
    return Promise.resolve();
  }

  getProxyInfo(id: string): smarthome.ProxyInfo {
    //TODO(cjdaly) implementation
    throw new Error('Method not implemented.');
  }

  /**
   * Checks if a given command is registered as an expected command.
   * If a match happens, the associated response is returned.
   * @param command  The command to send and check against expected commands.
   * @returns  Promise that resolves to the expected command's response, otherwise a `HandlerError`
   */
  public send(
    command: smarthome.DataFlow.CommandRequest
  ): Promise<smarthome.DataFlow.CommandBase> {
    if (this.expectedCommandToResponse.has(command)) {
      return Promise.resolve(this.expectedCommandToResponse.get(command)!);
    }
    throw new smarthome.IntentFlow.HandlerError(command.requestId);
  }
}
