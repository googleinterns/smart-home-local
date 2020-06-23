/*
 * Tests to verify stub behaviors
 */
/// <reference types="@google/local-home-sdk" />
import cbor from 'cbor';
import test from 'ava';
import { UDPDevice, DiscoveryData, MockNetwork } from '../common/mock-radio';

// Importing stub-setup loads stubs into global scope as a side-effect
// Bundled HomeApp may not be imported without these globals first being loaded
import { loadHomeApp } from '../common/stub-setup';
import {
  MockLocalHomePlatform,
  UDPScanConfig,
  ScanState,
} from '../common/mock-local-home-platform';

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

  // Mock a network that implements UDP
  const mockNetwork = new MockNetwork();

  // Mock the Local Home Platform
  const mockLocalHomePlatform = new MockLocalHomePlatform(mockNetwork, [
    scanConfig,
  ]);

  // Mock a UDP Device
  const mockDevice = new UDPDevice();

  // Device data that mock device sends back
  const discoveryData: DiscoveryData = new DiscoveryData(
    'test-device-id',
    '2',
    '0.0.1',
    '1.2.3',
    [12345]
  );

  // Sample device response
  mockDevice.setUDPMessageAction((msg: Buffer, rinfo: any) => {
    const packetBuffer = Buffer.from(scanConfig.discoveryPacket, 'hex');
    if (msg.compare(packetBuffer) !== 0) {
      console.warn('UDP received unknown payload:', msg, 'from:', rinfo);
      return;
    }
    console.debug('UDP received discovery payload:', msg, 'from:', rinfo);

    // TODO(cjdaly) Add error path
    const responsePacket = cbor.encode(discoveryData);
    mockNetwork.sendUDPMessage(
      responsePacket,
      rinfo.port,
      rinfo.address,
      discoveryData.channels[0],
      scanConfig.broadcastAddress
    );
  });

  //Mock network needs to listen for device response
  mockNetwork.registerUDPListener(
    mockDevice,
    scanConfig.broadcastPort,
    scanConfig.broadcastAddress
  );

  // Runs HomeApp from bundled javascript
  // HomeApp will call smarthome.App and smarthome.DeviceManager,
  // the class definitions of which we set in stub-setup.ts
  loadHomeApp();

  // Start scanning
  mockLocalHomePlatform.triggerScan();

  t.pass();
});
