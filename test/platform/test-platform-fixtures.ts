/**
 * Fixtures used across internal tests
 */
/// <reference types="@google/local-home-sdk" />
/**
 * Creates a basic Identify handler that returns the specified
 * deviceId and verificationId.
 * @param deviceId  The `id` to include in the `IdentifyResponse`.
 * @param verificationId  The `verificationId` to return in the `IdentifyResponse`.
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
          verificationId,
        },
      },
    };
  };
}
