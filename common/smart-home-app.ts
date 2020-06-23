/*
 * Stub for App class
 */
/// <reference types="@google/local-home-sdk" />

const App = class {
  private version: string;
  constructor(version: string) {
    this.version = version;
  }
  public getDeviceManager() {
    return deviceManager;
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


/**
* Stub function 
**/ 

export function smarthomeAppStub(deviceManager?: any) {
  return new App('test-version');
}
