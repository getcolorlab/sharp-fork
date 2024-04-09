const { spawn } = require('child_process');

/**
 * Spawns a child process to run a program with the specified arguments and environment variables.
 *
 * This asynchronous function uses Node.js's `spawn` from the `child_process` module to create a new child process.
 * It optionally logs standard output and standard error streams based on the provided options.
 *
 * @param {string} programPath - The path to the program to execute.
 * @param {Array<string>} args - Arguments to pass to the program.
 * @param {Object} options - Options for the `spawn` command. Can include a key `env` to set environment variables
 * @param {Object} opts - Options for logging standard output and error. Defaults to not logging either.
 * @param {boolean} opts.logStdOut - Flag to log standard output. Default is false.
 * @param {boolean} opts.logStdErr - Flag to log standard error. Default is false.
 *
 * @returns {Promise<string>} A promise that resolves with the standard output data from the child process
 * or rejects with an error message if the child process exits with a non-zero exit code.
 *
 * @throws {Error} Throws an error with the standard error output if the child process exits with a non-zero exit code.
 *
 * @example
 * // Example usage:
 * spawnChild('path/to/program', ['arg1', 'arg2'], { ENV_VAR: 'value' }, { logStdOut: true, logStdErr: true })
 *   .then(output => console.log(output))
 *   .catch(error => console.error(error));
 */
module.exports = async function spawnChild(programPath, args, options = {}, opts = {
  logStdOut: false,
  logStdErr: false,
}) {
  // Spawn child
  const child = spawn(
    programPath,
    args,
    {
      ...options,
      env: {
        ...process.env,
        ...options.env,
      },
    },
  );

  // Gather data
  let data = '';
  for await (const chunk of child.stdout) {
    if (opts.logStdOut) console.log(chunk.toString()); // eslint-disable-line no-console
    data += chunk;
  }

  // Gather errors
  let error = '';
  for await (const chunk of child.stderr) {
    if (opts.logStdErr) console.log(chunk.toString()); // eslint-disable-line no-console
    error += chunk;
  }

  // Await for the program to exist
  const exitCode = await new Promise((resolve) => {
    child.on('close', resolve);
  });

  // Reject the promise if exit code > 0 (an error occurred)
  if (exitCode) {
    if (opts.logStdErr) console.log(`subprocess error exit ${exitCode}, ${error}`); // eslint-disable-line no-console
    throw new Error(error);
  }

  // Return the data
  return data;
}
