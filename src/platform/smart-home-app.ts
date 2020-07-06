/*
 * Stub for App class
 */
/// <reference types="@google/local-home-sdk" />

import { App } from '@google/local-home-sdk';

//TODO(cjdaly) fill in implementation of these methods
export class AppStub implements App {
  private version: string;
  private deviceManager: any;
  constructor(version: string) {
    this.version = version;
  }
  getDeviceManager(): smarthome.DeviceManager {
    return this.deviceManager;
  }
  listen(): Promise<void> {
    return Promise.resolve();
  }
  onExecute(handler: smarthome.IntentFlow.ExecuteHandler): this {
    return this;
  }
  onIdentify(handler: smarthome.IntentFlow.IdentifyHandler): this {
    return this;
  }
  onReachableDevices(
    handler: smarthome.IntentFlow.ReachableDevicesHandler
  ): this {
    return this;
  }
}
