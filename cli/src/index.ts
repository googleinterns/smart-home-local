import yargs from 'yargs/yargs';
import {Worker} from 'worker_threads';
import {CommandProcessor} from './command-processor';

const APP_INSTANCE_PATH = './build/src/worker-instance.js';

/**
 * Process initial command-line arguments.
 */
const argv = yargs()
  .usage('Usage: $0 --app PATH')
  .options('app', {
    describe: 'The path of the Local Fulfillment App entry point.',
    type: 'string',
    demandOption: true,
  })
  .parse(process.argv.slice(2));

/**
 * Entry point for running the command line interface.
 */
async function main() {
  const worker = new Worker(APP_INSTANCE_PATH, {
    workerData: argv.app,
  }).on('error', error => {
    console.error(
      'An error occured while trying to initialize the command line interface:\n' +
        error.toString()
    );
  });
  const commandProcessor = new CommandProcessor(worker);
  await commandProcessor.processUserInput();
  worker.terminate();
}

main();
