/// <reference types="@google/local-home-sdk" />

/**
 * Sample Identify handler that is tested against in example tests
 * @param identifyRequest   The `IdentifyRequest` sent by the Local Home Platform
 */
export function identifyHandler(
  identifyRequest: smarthome.IntentFlow.IdentifyRequest
) {
  const device = identifyRequest.inputs[0].payload.device;
  if (device.udpScanData === undefined) {
    throw Error('Missing discovery response');
  }
  const scanData = JSON.parse(
    Buffer.from(device.udpScanData.data, 'hex').toString()
  );
  console.log(scanData);
  if (scanData.localDeviceId === undefined) {
    throw Error('Missing localDeviceId in discovery response');
  }
  return {
    requestId: identifyRequest.requestId,
    intent: smarthome.Intents.IDENTIFY,
    payload: {
      device: {
        id: device.id || '',
        verificationId: scanData.localDeviceId,
      },
    },
  };
}

/**
 * Sample Execute handler that is tested against in example tests
 * @param executeRequest  The `ExecuteRequest` sent by the Local Home Platform
 */
export function executeHandler(
  executeRequest: smarthome.IntentFlow.ExecuteRequest
) {
  return new smarthome.Execute.Response.Builder()
    .setRequestId(executeRequest.requestId)
    .setSuccessState(
      executeRequest.inputs[0].payload.commands[0].devices[0].id,
      {}
    )
    .build();
}

/**
 * Creates a 'UdpRequestData' to use for testing `DeviceManager` functionality
 * @param buffer  The `Buffer` to include in the returned request data
 * @param requestId  The request id to set in the request data
 * @param deviceId  The device id to set in the request data
 * @param port  The port to set in the request data
 */
export function createUdpDeviceCommand(
  buffer: Buffer,
  requestId: string,
  deviceId: string,
  port: number
): smarthome.DataFlow.UdpRequestData {
  const deviceCommand = new smarthome.DataFlow.UdpRequestData();
  deviceCommand.data = buffer.toString('hex');
  deviceCommand.requestId = requestId;
  deviceCommand.deviceId = deviceId;
  deviceCommand.port = port;
  return deviceCommand;
}