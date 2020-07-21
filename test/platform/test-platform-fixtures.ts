/**
 * Fixtures used across internal tests
 */
/// <reference types="@google/local-home-sdk" />

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

/**
 * Creates a basic Identify handler that returns the specified id and verificationId.
 * @param deviceId  The `id` to include in the `IdentifyResponse` in the handler.
 * @param verificationId  The `verificationId` to include in the `IdentifyResponse` in the handler.
 */
export function createIdentifyHandler(
  deviceId: string,
  verificationId: string
): smarthome.IntentFlow.IdentifyHandler {
  return async (identifyRequest: smarthome.IntentFlow.IdentifyRequest) => {
    return {
      requestId: identifyRequest.requestId,
      intent: smarthome.Intents.IDENTIFY,
      payload: {
        device: {
          id: deviceId,
          verificationId: verificationId,
        },
      },
    };
  };
}

/**
 * Created a basic Execute handler that forwards a specified `CommandRequest`
 * to a referenced `DeviceManager.
 * @param deviceCommand  The single command to send to the referenced `DeviceManager`.
 * @param deviceManager  The `DeviceManager` to forward the `CommandRequest` to.
 */
export function createExecuteHandler(
  deviceCommand: smarthome.DataFlow.CommandRequest,
  deviceManager: smarthome.DeviceManager
) {
  return async (executeRequest: smarthome.IntentFlow.ExecuteRequest) => {
    const command = executeRequest.inputs[0].payload.commands[0];
    const device = command.devices[0];

    // Create the Execute response to send back to platform
    const executeResponse = new smarthome.Execute.Response.Builder().setRequestId(
      executeRequest.requestId
    );

    // Perform required DeviceManager actions and update response
    try {
      const result = await deviceManager.send(deviceCommand);
      executeResponse.setSuccessState(result.deviceId, {});
    } catch (e) {
      executeResponse.setErrorState(device.id, e.errorCode);
    }
    return executeResponse.build();
  };
}
