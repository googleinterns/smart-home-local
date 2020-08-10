import {Worker} from 'worker_threads';
import yargs from 'yargs/yargs';
import * as readline from 'readline';
import {CommandMessage, READY_FOR_MESSAGE, CHECK_READY} from './commands';
import {ExecuteMessage, IdentifyMessage, ScanMessage} from './commands';
import {UDPScanConfig} from '../radio/radio-controller';

/**
 * Class to parse raw user input from stdin.
 */
export class CommandProcessor {
  private worker: Worker;
  constructor(worker: Worker) {
    this.worker = worker;
  }

  /**
   * Parses a string and returns a CommandMessage, if valid.
   * @param userCommand  A string to parse.
   * @returns  A promise that resolves to a valid `CommandMessage`,
   *   or void if an `exit` command was detected
   */
  private async parseIntent(
    userCommand: string
  ): Promise<CommandMessage | void> {
    const argv = await yargs()
      .command(
        'udp-scan',
        'Scan and identify devices with a given UDP scan configuration.',
        yargs => {
          return yargs
            .option('broadcast_address', {
              describe: 'Destination IP address for the UDP broadcast.',
              type: 'string',
              demandOption: true,
            })
            .option('broadcast_port', {
              describe: 'The destination port for the UDP discovery broadcast.',
              type: 'number',
              demandOption: true,
            })
            .option('listen_port', {
              describe: 'The port to listen for the UDP discvery response.',
              type: 'number',
              demandOption: true,
            })
            .option('discovery_packet', {
              describe: 'The payload to send in the UDP broadcast.',
              type: 'string',
              demandOption: true,
            })
            .option('request_id', {
              describe: 'An optional request ID for the Identify Request.',
              type: 'string',
              default: 'default-request-id',
              demandOption: false,
            })
            .option('device_id', {
              describe: 'The device ID to include in the Identify Request.',
              type: 'string',
              default: 'default-device-id',
              demandOption: false,
            });
        }
      )
      .command(
        'simulate-identify',
        'Manually trigger an Identify response.',
        yargs => {
          return yargs
            .option('request_id', {
              describe: 'The request Id',
              type: 'string',
              demandOption: true,
            })
            .option('discovery_buffer', {
              describe: 'The IDENTIFY discovery buffer represented as a string',
              type: 'string',
              demandOption: true,
            })
            .option('device_id', {
              describe: 'The device Id',
              type: 'string',
              demandOption: true,
            });
        }
      )
      .command('trigger-execute', 'Trigger an Execute command.', yargs => {
        return yargs
          .option('local_device_id', {
            describe: 'The local device Id',
            type: 'string',
            demandOption: true,
          })
          .option('command', {
            describe: 'The execute command to send to device_id',
            type: 'string',
            demandOption: true,
          })
          .option('params', {
            describe:
              'The params argument for the execute command, in JSON format',
            type: 'string',
            default: '{}',
            demandOption: false,
          })
          .option('custom_data', {
            describe:
              'The customData argument for the execute command, in JSON format',
            type: 'string',
            default: '{}',
            demandOption: false,
          });
      })
      .command('exit', 'Exit the command line interface.')
      .demandCommand(1, 'Must provide a valid command')
      .help()
      .parse(userCommand, (error: Error) => {
        if (error !== null) {
          throw error;
        }
      });

    /**
     * Parse argv based on command and return a `CommandMessage`
     */
    const command = argv._[0];
    switch (command) {
      case 'udp-scan': {
        const scanConfig = new UDPScanConfig(
          argv.broadcast_address,
          argv.broadcast_port,
          argv.listen_port,
          argv.discovery_packet
        );
        return new ScanMessage(argv.device_id, argv.request_id, scanConfig);
      }
      case 'simulate-identify':
        return new IdentifyMessage(
          argv.request_id,
          argv.discovery_buffer,
          argv.device_id
        );
      case 'trigger-execute':
        return new ExecuteMessage(
          argv.request_id,
          argv.local_device_id,
          argv.command,
          JSON.parse(argv.params),
          JSON.parse(argv.custom_data)
        );
      case 'exit':
        return Promise.resolve();
      default:
        throw new Error('Unsupported command: ' + command);
    }
  }

  /**
   * The main user input to response loop.
   * Recieves raw user input and attempts to parse and forward
   * messages to the worker thread.
   */
  async processUserInput(): Promise<void> {
    // Open a readline interface
    const readlineInterface = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    await new Promise(resolve => {
      // Pings the worker thread.
      this.worker.postMessage(CHECK_READY);

      this.worker.on('message', async message => {
        // Waits for worker thread to indicate it's ready to take another message.
        if (message !== READY_FOR_MESSAGE) {
          return;
        }
        readlineInterface.question('Awaiting input...\n', async input => {
          if (input.length === 0) {
            // Ping worker thread.
            this.worker.postMessage(CHECK_READY);
            return;
          }
          try {
            const commandMessage = await this.parseIntent(input);
            if (commandMessage === undefined) {
              // Exit command recieved. Resolve promise.
              console.log('Exit command received.  Terminating...');
              resolve();
              return;
            }
            // Post `CommandMessage` to worker thread.
            this.worker.postMessage(commandMessage);
          } catch (error) {
            // Catch possible parsing error.
            console.error(error);
            // Ping worker thread.
            this.worker.postMessage(CHECK_READY);
          }
        });
      });
    });

    // Clean up the readline interface.
    readlineInterface.close();
    return Promise.resolve();
  }
}
