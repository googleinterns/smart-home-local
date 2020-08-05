/**
 * Stubs to allow handlers to access smarthome.DataFlow
 */

export const DataFlowStub: typeof smarthome.DataFlow = {
  UdpRequestData: class {
    protocol: smarthome.Constants.Protocol = smarthome.Constants.Protocol.UDP;
    requestId = '';
    deviceId = '';
    data = '';
    port = 0;
  },
  TcpRequestData: class {
    protocol: smarthome.Constants.Protocol = smarthome.Constants.Protocol.TCP;
    requestId = '';
    deviceId = '';
    data = '';
    bytesToRead?: number;
    hostname?: string;
    port = 0;
    operation: smarthome.Constants.TcpOperation =
      smarthome.Constants.TcpOperation.WRITE;
  },
  HttpRequestData: class {
    protocol: smarthome.Constants.Protocol = smarthome.Constants.Protocol.HTTP;
    requestId = '';
    deviceId = '';
    data = '';
    dataType = '';
    headers = '';
    additionalHeaders: {[key: string]: string} = {};
    method: smarthome.Constants.HttpOperation =
      smarthome.Constants.HttpOperation.GET;
    path = '';
    port?: number;
  },
};

export class UdpResponseData implements smarthome.DataFlow.UdpResponseData {
  udpResponse: smarthome.DataFlow.UdpResponse;
  requestId: string;
  deviceId: string;
  protocol: smarthome.Constants.Protocol = smarthome.Constants.Protocol.UDP;
  constructor(
    requestId: string,
    deviceId: string,
    udpResponse: smarthome.DataFlow.UdpResponse
  ) {
    this.requestId = requestId;
    this.deviceId = deviceId;
    this.udpResponse = udpResponse;
  }
}

export class UdpResponse implements smarthome.DataFlow.UdpResponse {
  responsePackets?: string[];
  constructor(responsePackets?: string[]) {
    this.responsePackets = responsePackets;
  }
}

export class TcpResponseData implements smarthome.DataFlow.TcpResponseData {
  tcpResponse: smarthome.DataFlow.TcpResponse;
  requestId: string;
  deviceId: string;
  protocol: smarthome.Constants.Protocol = smarthome.Constants.Protocol.UDP;
  constructor(
    requestId: string,
    deviceId: string,
    tcpResponse: smarthome.DataFlow.TcpResponse
  ) {
    this.requestId = requestId;
    this.deviceId = deviceId;
    this.tcpResponse = tcpResponse;
  }
}

export class TcpResponse implements smarthome.DataFlow.TcpResponse {
  data: string;
  constructor(data = '') {
    this.data = data;
  }
}
