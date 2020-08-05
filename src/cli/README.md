# Command Line Interface

This is a simple command line interface for interacting with a Local Fulfillment app.

# Usage

TODO(cjdaly) update usage

**To start a virtual device:**

`npm start -- --udp_discovery_port 3320 --udp_discovery_packet ff --device_id local-device-id`

**Example Commands:**

`udp-scan --broadcast_address localhost --broadcast_port 3320 --listen_port 3311 --discovery_packet ff`

`simulate-identify --request_id sample-request-id --discovery_buffer ff --device_id test-device-id-simulate`

`trigger-execute --local_device_id local-device-id --command action.devices.commands.ColorAbsolute --params {"color":{"name":"magenta","spectrumRGB":"0xff00ff"}} --custom_data {"channel":1,"leds":8,"control_protocol":"UDP","port":7890}`

`trigger-execute --local_device_id local-device-id --command action.devices.commands.ColorAbsolute --params {"color":{"name":"red","spectrumRGB":"0xebae34"}} --custom_data {"channel":1,"leds":2,"control_protocol":"TCP","port":7890}`
