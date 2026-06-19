/**
 * Matta Reader build utility - firefox only, stripped down
 */

// @ts-check
import {fork} from 'node:child_process';
import {join} from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

import {log} from './utils.js';

const __filename = join(fileURLToPath(import.meta.url), '../build.js');

async function executeChildProcess(args) {
    const child = fork(__filename, args);
    process.on('SIGINT', () => {
        child.kill('SIGKILL');
        process.exit(130);
    });
    return new Promise((resolve, reject) => child.on('error', reject).on('close', resolve));
}

function printHelp() {
    console.log([
        'Matta Reader build utility',
        '',
        'Usage: build [build parameters]',
        '',
        'Build targets (firefox only):',
        '  --firefox      MV2 for Firefox',
        '',
        'Build type:',
        '  --release      Release bundle',
        '  --debug        Build for development',
        '  --watch        Incremental build for development',
        '',
        'Logging (for debugging):',
        '  --log-info     Log lots of data',
        '  --log-warn     Log only warnings',
    ].join('\n'));
}

function validateArguments(args) {
    const validationErrors = [];
    const validFlags = ['--firefox', '--firefox-mv2', '--release', '--debug', '--watch', '--log-info', '--log-warn', '--test'];
    const invalidFlags = args.filter((flag) => !validFlags.includes(flag) && !flag.startsWith('--version='));
    invalidFlags.forEach((flag) => validationErrors.push(`Invalid flag ${flag}`));
    return validationErrors;
}

async function run() {
    const args = process.argv.slice(3);

    const shouldPrintHelp = args.length === 0 || process.argv[2] !== 'build' || args.includes('-h') || args.includes('--help');
    if (shouldPrintHelp) {
        printHelp();
        process.exit(0);
    }

    const validationErrors = validateArguments(args);
    if (validationErrors.length > 0) {
        validationErrors.forEach(log.error);
        printHelp();
        process.exit(130);
    }

    await executeChildProcess(args);
}

run();
