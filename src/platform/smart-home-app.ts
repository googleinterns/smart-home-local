/*
 * Stub for App class
 */
/// <reference types="@google/local-home-sdk" />

import {MockLocalHomePlatform} from './mock-local-home-platform';

export class AppStub implements smarthome.App {
  private version: string;
  public identifyHandler: smarthome.IntentFlow.IdentifyHandler | undefined;
  public executeHandler: smarthome.IntentFlow.ExecuteHandler | undefined;
  public reachableDevicesHandler:
    | smarthome.IntentFlow.ReachableDevicesHandler
    | undefined;

  constructor(version: string) {
    this.version = version;
    //  Allows Local Home Platform to access handlers
    MockLocalHomePlatform.getInstance().setApp(this);
  }

  getDeviceManager(): smarthome.DeviceManager {
    return MockLocalHomePlatform.getInstance().getDeviceManager();
  }

  listen(): Promise<void> {
    MockLocalHomePlatform.getInstance().notifyHomeAppReady();
    return Promise.resolve();
  }

  public onExecute(executeHandler: smarthome.IntentFlow.ExecuteHandler): this {
    this.executeHandler = executeHandler;
    return this;
  }

  public onIdentify(
    identifyHandler: smarthome.IntentFlow.IdentifyHandler
  ): this {
    this.identifyHandler = identifyHandler;
    return this;
  }

  public onReachableDevices(
    reachableDevicesHandler: smarthome.IntentFlow.ReachableDevicesHandler
  ): this {
    this.reachableDevicesHandler = reachableDevicesHandler;
    return this;
  }
}
