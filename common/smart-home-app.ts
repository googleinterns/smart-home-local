/*
 * Stub for App class
 */
/// <reference types="@google/local-home-sdk" />

export const AppStub = class {
  private version: string;
  private deviceManager: any;
  constructor(version: string) {
    this.version = version;
  }
  public setDeviceManager(deviceManager: any) {
    this.deviceManager = deviceManager;
  }
  public getDeviceManager() {
    return this.deviceManager;
  }
  public listen() {
    return Promise.resolve();
  }
  public onExecute() {
    return this;
  }
  public onIdentify() {
    return this;
  }
  public onReachableDevices() {
    return this;
  }
};
