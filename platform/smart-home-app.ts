/*
 * Stub for App class
 */
/// <reference types="@google/local-home-sdk" />

import { DeviceManagerStub } from './device-manager';
import { MockLocalHomePlatform } from './mock-local-home-platform';
import { MockNetwork } from './mock-radio';

export class AppStub implements smarthome.App {
  private version: string;

  constructor(version: string) {
    this.version = version;
    //  Allows Local Home Platform to access handlers
    MockLocalHomePlatform.getInstance().setApp(this);
  }

  getDeviceManager(): smarthome.DeviceManager {
    return MockLocalHomePlatform.getInstance().getDeviceManager();
  }

  //TODO(cjdaly) fill in implementation of the below methods
  listen(): Promise<void> {
    return;
  }
  onExecute(handler: smarthome.IntentFlow.ExecuteHandler): this {
    return;
  }
  onIdentify(handler: smarthome.IntentFlow.IdentifyHandler): this {
    return;
  }
  onReachableDevices(
    handler: smarthome.IntentFlow.ReachableDevicesHandler
  ): this {
    return;
  }
}
