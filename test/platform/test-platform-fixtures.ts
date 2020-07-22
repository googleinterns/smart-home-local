/**
 * Fixtures used across internal tests
 */
/// <reference types="@google/local-home-sdk" />
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