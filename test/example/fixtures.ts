/// <reference types="@google/local-home-sdk" />

/**
 * Sample Identify handler that is tested against
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
 * Sample Execute handler that is tested against
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

export function createDeviceCommand(
  protocol: smarthome.Constants.Protocol,
  buffer: Buffer,
  requestId: string,
  deviceId: string,
  port: number
) {
  const deviceCommand = makeSendCommand(protocol, buffer);
  deviceCommand.requestId = requestId;
  deviceCommand.deviceId = deviceId;
  deviceCommand.port = port;
  return deviceCommand;
}

/**
 * Fixtures used across internal tests
 */
export function makeSendCommand(
  protocol: smarthome.Constants.Protocol,
  buf: Buffer
) {
  switch (protocol) {
    case smarthome.Constants.Protocol.UDP:
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
