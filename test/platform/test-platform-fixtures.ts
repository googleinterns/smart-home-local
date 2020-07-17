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

export class UdpResponseData implements smarthome.DataFlow.UdpResponseData {
  constructor(requestId: string, deviceId: string) {
    this.requestId = requestId;
    this.deviceId = deviceId;
  }
  requestId: string;
  deviceId: string;
  protocol: smarthome.Constants.Protocol = smarthome.Constants.Protocol.UDP;
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

export function createIdentifyHandler(
  deviceId: string,
  veriicationId: string
): smarthome.IntentFlow.IdentifyHandler {
  return async (identifyRequest: smarthome.IntentFlow.IdentifyRequest) => {
    return {
      requestId: identifyRequest.requestId,
      intent: smarthome.Intents.IDENTIFY,
      payload: {
        device: {
          id: deviceId,
          verificationId: veriicationId,
        },
      },
    };
  };
}

export function createExecuteHandler(
  deviceCommand: smarthome.DataFlow.CommandRequest,
  deviceManager: smarthome.DeviceManager
) {
  return async (executeRequest: smarthome.IntentFlow.ExecuteRequest) => {
    const command = executeRequest.inputs[0].payload.commands[0];
    const device = command.devices[0];

    // Create execution response command success/failure.
    const executeResponse = new smarthome.Execute.Response.Builder().setRequestId(
      executeRequest.requestId
    );

    try {
      const result = await deviceManager.send(deviceCommand);
      executeResponse.setSuccessState(result.deviceId, {});
    } catch (e) {
      executeResponse.setErrorState(device.id, e.errorCode);
    }
    return executeResponse.build();
  };
}
