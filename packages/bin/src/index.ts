#!/usr/bin/env node
import yargs from 'yargs';
import StartCommand from "./command/start";
import {Initializer} from "./initializer";


function main() {
  // enable logger
  if (process.env.LOGGER === undefined) {
    process.env.LOGGER = 'INFO';
  }

  Initializer.init();

  // parser
  const _ = yargs
    .usage('alarmmgr <hello@darwinia.network>')
    .help('help').alias('help', 'h')
    .version('version', "0.0.1").alias('version', 'V')
    .command(StartCommand)
    .argv;

  // show help if no input
  if (process.argv.length < 3) {
    yargs.showHelp();
  }
}

main();
