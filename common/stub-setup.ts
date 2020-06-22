/*
 * Injects the stubs into the global scope.
 * Bundled HomeApp cannot be loaded until these globals are set.
 */
import { DeviceManagerStub } from './device-manager';
import { AppStub } from './smart-home-app';

(global as any).smarthome = {
  App: AppStub,
  DeviceManager: DeviceManagerStub,
};

//TODO(cjdaly) find a cleaner way to do this.
export function loadHomeApp() {
  require('../home-app/bundle');
}
