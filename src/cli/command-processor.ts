import {Worker} from 'worker_threads';
import yargs from 'yargs/yargs';
import * as readline from 'readline';

/**
 * A flag for the worker thread to indicate it's ready to recieve messages.
 */
export const READY_FLAG = 'READY';

/**
 * An interface to formalize the message being sent to the worker thread.
 */
export interface IntentMessage {
  intentType: string;
  requestId: string;
}

/**
 * A class containing all parameters needed to process an Identify command.
 */
export class IdentifyMessage implements IntentMessage {
  intentType = 'IDENTIFY';
  requestId: string;
  discoveryBuffer: string;
  deviceId: string;

  /**
   * @param requestId  The request id for a triggered Identify request.
   * @param discoveryBuffer  The discovery buffer to send in a triggered Identify request.
   * @param deviceId  The device id for a triggered Identify request.
   * @returns  A new IntentMessage instance.
   */
  constructor(requestId: string, discoveryBuffer: string, deviceId: string) {
    this.requestId = requestId;
    this.discoveryBuffer = discoveryBuffer;
    this.deviceId = deviceId;
  }
}

/**
 * A class containing all parameters needed to process an Identify command.
 */
export class ExecuteMessage implements IntentMessage {
  intentType = 'EXECUTE';
  requestId: string;
  localDeviceId: string;
  executeCommand: string;
  params: Record<string, unknown>;
  customData: Record<string, unknown>;

  /**
   * @param requestId  The request id for a triggered Execute request.
   * @param localDeviceId  The localDeviceId for a triggered Execute request.
   * @param executeCommand  The single command string to set in the triggered Execute request.
   * @param params  The params array for the single Execute command.
   * @param customData  The customData array for the single Execute command.
   * @returns  A new ExecuteCommand instance.
   */
  constructor(
    requestId: string,
    localDeviceId: string,
    executeCommand: string,
    params: Record<string, unknown>,
    customData: Record<string, unknown>
  ) {
    this.requestId = requestId;
    this.localDeviceId = localDeviceId;
    this.executeCommand = executeCommand;
    this.params = params;
    this.customData = customData;
  }
}

export class CommandProcessor {
  private worker: Worker;
  constructor(worker: Worker) {
    this.worker = worker;
  }

  // Wrapper for argument parsing with yargs.
  private async parseIntent(
    userCommand: string
  ): Promise<IntentMessage | void> {
    const argv = await yargs()
      .command('identify', 'Trigger an Identify command.', yargs => {
        return yargs
          .option('request_id', {
            describe: 'The request Id',
            type: 'string',
            demandOption: true,
          })
          .option('discovery_buffer', {
            describe: 'The IDENTIFY dicovery buffer represented as a string',
            type: 'string',
            demandOption: true,
          })
          .option('device_id', {
            describe: 'The device Id',
            type: 'string',
            demandOption: true,
          });
      })
      .command('execute', 'Trigger an Execute command.', yargs => {
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
      .demandCommand(1)
      .parse(userCommand, (error: Error) => {
        if (error !== null) {
          throw error;
        }
      });

    /**
     * Parse argv based on command and return an IntentMessage
     */
    const command = argv._[0];
    switch (command) {
      case 'exit':
        return Promise.resolve();
      case 'identify':
        return new IdentifyMessage(
          argv.request_id,
          argv.discovery_buffer,
          argv.device_id
        );
      case 'execute':
        return new ExecuteMessage(
          argv.request_id,
          argv.local_device_id,
          argv.command,
          JSON.parse(argv.params),
          JSON.parse(argv.custom_data)
        );
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

    // Flag for signaling app exit.
    let exit = false;
    while (!exit) {
      // Wrap the asyncronous question/response sequence in a promise to delay execution.
      await new Promise(resolve => {
        readlineInterface.question('Awaiting input...\n', async input => {
          if (input.length === 0) {
            resolve();
            return;
          }
          try {
            const intentMessage = await this.parseIntent(input);
            if (intentMessage === undefined) {
              exit = true;
              resolve();
              return;
            }
            // Post message to worker thread.
            this.worker.postMessage(intentMessage);
          } catch (error) {
            // Print the error message and continue the loop.
            console.error(error.message);
          }
          resolve();
        });
      });
    }

    // Clean up the readline interface.
    readlineInterface.close();
    return Promise.resolve();
  }
}
