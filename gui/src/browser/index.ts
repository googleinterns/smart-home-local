/**
 * The entry point for the browser app.
 */
import {smarthomeStub, AppStub} from '@google/local-home-testing';
import {PlatformCoordinator} from './platform-coordinator';
import {UDPScanConfig} from '@google/local-home-testing/build/src/radio/dataflow';

/**
 * Initialize the UI DOM.
 * Redefine all `console.log` and `console.error` calls to log
 * to an element in the page.
 */
const logElement = document.getElementById('log')!;
const modifiedConsole: any = console;
modifiedConsole.defaultlog = console.log;
modifiedConsole.log = (message: string) => {
  modifiedConsole.defaultlog(message);
  logElement.innerHTML += `[${new Date().toLocaleTimeString()}]:<br/>${message}<br/>`;
  // Scrolls to the bottom of the element.
  logElement.scrollTop = logElement.scrollHeight;
};
modifiedConsole.error = modifiedConsole.log;

/**
 * Callback to hook into app initialization.
 */
let onAppInitialized: (app: AppStub) => void | undefined;

/**
 * A promise to resolve when the app constructor gets called.
 */
const saveAppStub = new Promise<AppStub>(resolve => {
  onAppInitialized = (app: AppStub) => {
    resolve(app);
  };
});

/**
 * Override the constructor to access the stub on creation.
 */
class ChromeAppStub extends AppStub {
  constructor(version: string) {
    super(version);
    onAppInitialized(this);
  }
}

/**
 * Set the global dependencies.
 */
smarthomeStub.App = ChromeAppStub;
export const smarthome = smarthomeStub;

/**
 * Listen for the app bundle file picker.
 */
const filePicker = document.getElementById('app-file-picker');
if (filePicker) {
  filePicker.addEventListener('change', async event => {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      // Run the javascript.
      eval(await files[0].text());
      (filePicker as HTMLInputElement).disabled = true;
    }
  });
}

/**
 * Create an instance of `PlatformCoordinator` to
 * manage radio and wrap platform.
 */
const platformCoordinator = new PlatformCoordinator(saveAppStub);

/**
 * A helper function to return the value of input fields.
 * @param id  The id of the element to get the value of.
 * @returns  The value of the `HTMLInputElement`.
 */
function getInputValue(id: string) {
  return (<HTMLInputElement>document.getElementById(id)).value;
}

/**
 * Fetches all UDP scan parameters from their respective input fields
 * and forwards them to the `PlatformController`.
 */
export function onUdpScanButton() {
  const requestId = getInputValue('udp-request-id');
  const deviceId = getInputValue('udp-device-id');
  const broadcastAddress = getInputValue('udp-broadcast-address');
  const broadcastPort = getInputValue('udp-broadcast-port');
  const listenPort = getInputValue('udp-listen-port');
  const discoveryPacket = getInputValue('udp-discovery-packet');
  const scanConfig = new UDPScanConfig(
    broadcastAddress,
    parseInt(broadcastPort),
    parseInt(listenPort),
    discoveryPacket
  );
  platformCoordinator.udpScan(requestId, scanConfig, deviceId!);
}

/**
 * Fetches all Execute intent parameters from their respective input fields
 * and forwards them to the `PlatformController`.
 */
export function onExecuteButton() {
  const requestId = getInputValue('execute-request-id');
  const deviceId = getInputValue('execute-device-id');
  const command = getInputValue('execute-command');
  const params = getInputValue('execute-params');
  const customData = getInputValue('execute-custom-data');
  platformCoordinator.execute(
    requestId,
    deviceId,
    command,
    JSON.parse(params),
    JSON.parse(customData)
  );
}

const udpScanForm = document.getElementById('udp-scan-form') as HTMLFormElement;
udpScanForm.addEventListener('submit', onUdpScanButton);
const executeForm = document.getElementById('execute-form') as HTMLFormElement;
executeForm.addEventListener('submit', onExecuteButton);
