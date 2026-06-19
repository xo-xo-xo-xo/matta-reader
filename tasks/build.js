// @ts-check
import process from 'node:process';

import bundleCSS from './bundle-css.js';
import bundleHTML from './bundle-html.js';
import bundleJS from './bundle-js.js';
import bundleLocales from './bundle-locales.js';
import bundleManifest from './bundle-manifest.js';
import clean from './clean.js';
import codeStyle from './code-style.js';
import copy from './copy.js';
import saveLog from './log.js';
import {PLATFORM} from './platform.js';
import {runTasks} from './task.js';
import {log} from './utils.js';
import zip from './zip.js';

const standardTask = [
    clean,
    bundleHTML,
    bundleJS,
    bundleCSS,
    bundleLocales,
    bundleManifest,
    copy,
    saveLog,
];

const buildTask = [
    ...standardTask,
    codeStyle,
    zip,
];

async function build({platforms, debug, watch, log: logging, test, version}) {
    log.ok('BUILD');
    platforms = {
        ...platforms,
        [PLATFORM.API]: false,
    };
    try {
        await runTasks(debug ? standardTask : buildTask, {platforms, debug, watch, log: logging, test, version});
        if (watch) {
            log.ok('Watching...');
        } else {
            log.ok('MISSION PASSED! RESPECT +');
        }
    } catch (err) {
        console.log(err);
        log.error(`MISSION FAILED!`);
        process.exit(13);
    }
}

function getParams(args) {
    const argMap = {
        '--firefox': PLATFORM.FIREFOX_MV2,
        '--firefox-mv2': PLATFORM.FIREFOX_MV2,
    };
    const platforms = {
        [PLATFORM.FIREFOX_MV2]: false,
    };
    let allPlatforms = true;
    for (const arg of args) {
        if (argMap[arg]) {
            platforms[argMap[arg]] = true;
            allPlatforms = false;
        }
    }
    if (allPlatforms) {
        Object.keys(platforms).forEach((platform) => platforms[platform] = true);
    }

    const versionArg = args.find((a) => a.startsWith('--version='));
    const version = versionArg ? versionArg.substring('--version='.length) : null;

    const release = args.includes('--release');
    const debug = args.includes('--debug');
    const watch = args.includes('--watch');
    const logInfo = watch && args.includes('--log-info');
    const logWarn = watch && args.includes('--log-warn');
    const logAssert = watch && args.includes('--log-assert');
    const log = logWarn ? 'warn' : (logInfo ? 'info' : (logAssert ? 'assert' : null));
    const test = args.includes('--test');

    return {release, debug, platforms, watch, log, test, version};
}

const args = process.argv.slice(2);
const params = getParams(args);
build({platforms: params.platforms, debug: params.debug, watch: params.watch, log: params.log, test: params.test, version: params.version});
