import test from 'ava';
import {Worker} from 'worker_threads';

const APP_INSTANCE_PATH = './build/src/worker-instance.js';
const INVALID_FILE_PATH = '/this/is/a/file/path/that/doesnt/exist/index.js';

test('invalid-file-path-bubbles-error', async t => {
  const error: Error = await new Promise<Error>(resolve => {
    new Worker(APP_INSTANCE_PATH, {
      workerData: INVALID_FILE_PATH,
    }).on('error', error => {
      resolve(error);
    });
  });

  t.is(
    error.message,
    'File at path /this/is/a/file/path/that/doesnt/exist/index.js not found.'
  );
});
