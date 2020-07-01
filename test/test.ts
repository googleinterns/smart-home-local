/*
 * Tests to verify stub behaviors
 */
import test from 'ava';
import cbor from 'cbor';
import {
  UDPDevice,
  MockNetwork,
  RemoteAddressInfo,
} from '../platform/mock-radio';
import { loadHomeApp } from '../platform/stub-setup';
import {
  MockLocalHomePlatform,
  UDPScanConfig,
  ScanState,
} from '../platform/mock-local-home-platform';

test('udp-device-connects', async (t) => {
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
  const discoveryData = {
    id: deviceId,
    model: '2',
    hw_rev: '0.0.1',
    fw_rev: '1.2.3',
    channels: [discoveryPort],
  };

  // Sample device response
  mockDevice.setUDPMessageAction((msg: Buffer, rinfo: RemoteAddressInfo) => {
    const packetBuffer = Buffer.from(scanConfig.discoveryPacket, 'hex');
    if (msg.compare(packetBuffer) !== 0) {
      console.warn('UDP received unknown payload:', msg, 'from:', rinfo);
      return;
    }
    console.debug('UDP received discovery payload:', msg, 'from:', rinfo);

    const discoveryBuffer = cbor.encode(discoveryData);

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

  loadHomeApp('../home-app/bundle');

  const connectedDeviceId = mockLocalHomePlatform.getNextDeviceIdRegistered();

  // Start scanning
  mockLocalHomePlatform.triggerScan();

  t.is(await connectedDeviceId, deviceId);
  t.is(mockLocalHomePlatform.getLocalDeviceIdMap().size, 1);
  t.is(
    mockLocalHomePlatform.getLocalDeviceIdMap().values().next().value,
    deviceId
  );
});
