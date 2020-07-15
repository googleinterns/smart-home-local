/**
 * DeviceManager Stub
 * TODO(cjdaly) integrate with Mock Local Home Platform and Mock Network
 **/
/// <reference types="@google/local-home-sdk" />

import {DeviceManager, IntentFlow} from '@google/local-home-sdk';

export class DeviceManagerStub implements DeviceManager {
  // Map of expected requests to responses
  private expectedCommandToResponse: Map<
    smarthome.DataFlow.TcpRequestData,
    smarthome.DataFlow.TcpResponseData
  > = new Map();

  public addExpectedRequest(
    expectedCommand: smarthome.DataFlow.TcpRequestData,
    response: smarthome.DataFlow.TcpResponseData
  ): void {
    this.expectedCommandToResponse.set(expectedCommand, response);
  }

  markPending(request: smarthome.IntentRequest): Promise<void> {
    throw new Error('Method not implemented.');
  }

  getProxyInfo(id: string): smarthome.ProxyInfo {
    //TODO(cjdaly) implementation
    throw new Error('Method not implemented.');
  }

  public send(
    command: smarthome.DataFlow.TcpRequestData
  ): Promise<smarthome.DataFlow.CommandSuccess> {
    if (this.expectedCommandToResponse.has(command)) {
      return Promise.resolve(this.expectedCommandToResponse.get(command)!);
    }
    return Promise.reject(new IntentFlow.HandlerError(command.requestId));
  }
}

export enum ControlKind {
  UDP = 'UDP',
  TCP = 'TCP',
  HTTP = 'HTTP',
}

export function makeSendCommand(
  protocol: ControlKind,
  buf: Buffer,
  path?: string
) {
  switch (protocol) {
    case ControlKind.UDP:
      return makeUdpSend(buf);
    case ControlKind.TCP:
      return makeTcpWrite(buf);
    case ControlKind.HTTP:
      return makeHttpPost(buf, path);
    default:
      throw Error(`Unsupported protocol for send: ${protocol}`);
  }
}

export function makeReceiveCommand(protocol: ControlKind, path?: string) {
  switch (protocol) {
    case ControlKind.TCP:
      return makeTcpRead();
    case ControlKind.HTTP:
      return makeHttpGet(path);
    default:
      throw Error(`Unsupported protocol for receive: ${protocol}`);
  }
}

function makeUdpSend(buf: Buffer) {
  const command = new smarthome.DataFlow.UdpRequestData();
  command.data = buf.toString('hex');
  return command;
}

function makeTcpWrite(buf: Buffer) {
  const command = new smarthome.DataFlow.TcpRequestData();
  command.operation = smarthome.Constants.TcpOperation.WRITE;
  command.data = buf.toString('hex');
  return command;
}

function makeTcpRead() {
  const command = new smarthome.DataFlow.TcpRequestData();
  command.operation = smarthome.Constants.TcpOperation.READ;
  command.bytesToRead = 1024;
  return command;
}

function makeHttpGet(path?: string) {
  const command = new smarthome.DataFlow.HttpRequestData();
  command.method = smarthome.Constants.HttpOperation.GET;
  if (path !== undefined) {
    command.path = path;
  }
  return command;
}

function makeHttpPost(buf: Buffer, path?: string) {
  const command = new smarthome.DataFlow.HttpRequestData();
  command.method = smarthome.Constants.HttpOperation.POST;
  command.data = buf.toString('base64');
  command.dataType = 'application/octet-stream';
  if (path !== undefined) {
    command.path = path;
  }
  return command;
}
