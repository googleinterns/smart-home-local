/*
 * Tests to verify stub behaviors
 */
import test from 'ava';
import cbor from 'cbor';
import { UDPDevice, MockNetwork } from '../platform/mock-radio';
import { loadHomeApp } from '../platform/stub-setup';
import {
  MockLocalHomePlatform,
  UDPScanConfig,
  ScanState,
} from '../platform/mock-local-home-platform';

// Tests a UDP identify flow end-to-end
test('udp-device-connects', async (t) => {
  // Common address for all UDP messaging
  const updAddress: string = '255.255.255.255';

  // First, create a scan configuration
  const scanConfig: UDPScanConfig = new UDPScanConfig(
    ScanState.Unprovisioned,
    updAddress,
    3311,
    3322,
    'A5A5A5'
  );

  // Mock a UDP Network
  const mockNetwork = new MockNetwork();

  // Mock the Local Home Platform
  const mockLocalHomePlatform = MockLocalHomePlatform.getInstance();
  mockLocalHomePlatform.initializeRadio(mockNetwork, [scanConfig]);

  const mockDevice = new UDPDevice(
    'test-device-id',
    mockNetwork,
    12345,
    updAddress
  );

  // Load HomeApp and ensure
  loadHomeApp('../bundle');

  // Assert listen() was called and handlers were loaded
  t.is(mockLocalHomePlatform.isHomeAppReady(), true);

  // Create promise to catch next deviceId registered
  const connectedDeviceId: Promise<string> = mockLocalHomePlatform.getNextDeviceIdRegistered();

  // Trigger Identify message to be sent to the Local Home Platform's port
  mockDevice.triggerIdentify(
    cbor.encode({
      id: 'test-device-id',
      model: '2',
      hw_rev: '0.0.1',
      fw_rev: '1.2.3',
      channels: [12345],
    }),
    scanConfig.listenPort,
    updAddress
  );

  t.is(await connectedDeviceId, mockDevice.getDeviceId());
  t.is(mockLocalHomePlatform.getLocalDeviceIdMap().size, 1);
  t.is(
    mockLocalHomePlatform.getLocalDeviceIdMap().values().next().value,
    mockDevice.getDeviceId()
  );
});
