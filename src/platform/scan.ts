/// <reference types="@google/local-home-sdk" />

export function parseSyncJSON(jsonString: string): SyncResponse {
  const request = JSON.parse(jsonString);
  const requiredTypes = [];
  if (request.requestId === undefined) {
    requiredTypes.push('requestId');
  }
  if (request.payload === undefined) {
    requiredTypes.push('payload');
  } else {
    if (request.payload.agentUserId === undefined) {
      requiredTypes.push('payload.agentUserId');
    }
    if (request.payload.devices === undefined) {
      requiredTypes.push('payload.devices');
    }
  }
  if (requiredTypes.length !== 0) {
    throw new Error(
      'Could not parse SyncResponse from JSON string.  Missing fields: ' +
        requiredTypes.join(' ')
    );
  }
  const syncResponsePayload = new SyncResponsePayload(
    request.payload.agentUserId,
    request.payload.devices,
    request.payload.errorCode,
    request.payload.debugString
  );
  return new SyncResponse(request.requestId, syncResponsePayload);
}

export class SyncResponsePayload
  implements smarthome.IntentFlow.ResponsePayload {
  constructor(
    agentUserId: string,
    devices: smarthome.IntentFlow.Device[],
    errorCode?: string,
    debugString?: string
  ) {
    this.agentUserId = agentUserId;
    this.devices = devices;
    this.errorCode = errorCode;
    this.debugString = debugString;
  }
  errorCode?: string;
  debugString?: string;
  agentUserId: string;
  devices: smarthome.IntentFlow.Device[];
}

export class SyncResponse {
  constructor(requestId: string, payload: SyncResponsePayload) {
    this.requestId = requestId;
    this.payload = payload;
  }
  requestId: string;
  payload: SyncResponsePayload;
}
