/*
 * Tests to verify stub behaviors
 */
/// <reference types="@google/local-home-sdk" />
import test from 'ava';
import {
  UDPDevice,
  MockNetwork,
  RemoteAddressInfo,
} from '../platform/mock-radio';
import {
  MockLocalHomePlatform,
  UDPScanConfig,
  ScanState,
} from '../platform/mock-local-home-platform';

// Tests a UDP identify flow end-to-end
test('udp-device-connects', (t) => {
  // First, create a scan configuration
  const scanConfig = new UDPScanConfig(
    ScanState.Unprovisioned,
    '255.255.255.255',
    3311,
    3312,
    'A5A5A5A5'
  );

  // Mock a UDP Network
  const mockNetwork = new MockNetwork();

  // Mock the Local Home Platform
  const mockLocalHomePlatform = MockLocalHomePlatform.getInstance();

  mockLocalHomePlatform.initializeRadio(mockNetwork, [scanConfig]);

  // Mock a UDP Device
  const mockDevice = new UDPDevice();

  const deviceId = 'test-device-id';
  // Device data that mock device sends back

  const discoveryPort = 12345;
  const discoveryData = JSON.stringify({
    id: 'test-device-id',
    model: '2',
    hw_rev: '0.0.1',
    fw_rev: '1.2.3',
    channels: [discoveryPort],
  });

  // Sets global smarthome namespace
  injectAppStub();

  (global as any).smarthome.Intents = {
    IDENTIFY: 'action.devices.IDENTIFY',
    EXECUTE: 'action.devices.EXECUTE',
  };

  // Sample device response
  mockDevice.setUDPMessageAction((msg: Buffer, rinfo: RemoteAddressInfo) => {
    const packetBuffer = Buffer.from(scanConfig.discoveryPacket, 'hex');
    if (msg.compare(packetBuffer) !== 0) {
      console.warn('UDP received unknown payload:', msg, 'from:', rinfo);
      return;
    }
    console.debug('UDP received discovery payload:', msg, 'from:', rinfo);

    const discoveryBuffer = Buffer.from(discoveryData);

    // TODO(cjdaly) Add error path
    mockNetwork.sendUDPMessage(
      discoveryBuffer,
      rinfo.port,
      rinfo.address,
      discoveryPort,
      scanConfig.broadcastAddress
    );
  });

  //Mock network needs to listen for device response
  mockNetwork.registerUDPListener(
    mockDevice,
    scanConfig.broadcastPort,
    scanConfig.broadcastAddress
  );

  // Start scanning
  mockLocalHomePlatform.triggerScan();

  t.is(mockLocalHomePlatform.getLocalDeviceIds().length, 1);
});
