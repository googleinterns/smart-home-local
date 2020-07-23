/**
 * Holds Execute stubs and helpers
 */
/// <reference types="@google/local-home-sdk" />

export const ExecuteStub: typeof smarthome.Execute = {
  Response: {
    Builder: class {
      private requestId = '';
      private commands: smarthome.IntentFlow.ExecuteResponseCommands[] = [];
      public setRequestId(requestId: string): this {
        this.requestId = requestId;
        return this;
      }
      public setSuccessState(deviceId: string, state: unknown): this {
        this.commands.push({
          ids: [deviceId],
          status: 'SUCCESS',
          states: state,
        });
        return this;
      }
      public setErrorState(
        deviceId: string,
        errorCode: smarthome.IntentFlow.ExecuteErrors
      ): this {
        this.commands.push({
          ids: [deviceId],
          status: 'ERROR',
          errorCode,
        });
        return this;
      }
      public build() {
        return {
          requestId: this.requestId,
          payload: {
            commands: this.commands,
          },
        };
      }
    },
  },
};

/**
 * A helper to build a simple `ExecuteRequestCommands` for sending
 * a single command to a single device
 * @param deviceId  The id of the single device to send the command
 * @param command  The single command to send to the device
 * @param params  Parmeters for the command
 * @returns  An `ExecuteRequestCommands` with the specified arguments
 */
export function createSimpleExecuteCommands(
  deviceId: string,
  command: string,
  params: Record<string, unknown>,
  customData: Record<string, unknown>
): smarthome.IntentFlow.ExecuteRequestCommands {
  return {
    devices: [{id: deviceId, customData}],
    execution: [{command, params}],
  };
}

/**
 * Implementation of smarthome.DataFlow.UpdResponseData for testing DeviceManager
 */
export class UdpResponseData implements smarthome.DataFlow.UdpResponseData {
  constructor(requestId: string, deviceId: string) {
    this.requestId = requestId;
    this.deviceId = deviceId;
  }
  requestId: string;
  deviceId: string;
  protocol: smarthome.Constants.Protocol = smarthome.Constants.Protocol.UDP;
}
