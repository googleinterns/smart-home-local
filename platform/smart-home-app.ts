/*
 * Stub for App class
 */
/// <reference types="@google/local-home-sdk" />

import { App } from '@google/local-home-sdk';

//TODO(cjdaly) fill in implementation of these methods
class AppStub implements App {
  private version: string;
  private deviceManager: any;
  constructor(version: string) {
    this.version = version;
  }
  getDeviceManager(): smarthome.DeviceManager {
    return;
  }
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
