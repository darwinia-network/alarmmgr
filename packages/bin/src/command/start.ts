import yargs from 'yargs';
import {StartHandler} from "../handler/start";


const StartCommand: yargs.CommandModule = {
  builder: (argv: yargs.Argv) => {
    return argv.array('probe');
  },
  command: 'start',
  describe: 'Start alarmmgr monitor',
  handler: async (args: yargs.Arguments) => {
    const {probe} = args;
    const handler = new StartHandler(probe as unknown as Array<string>);
    await handler.start();
  },
}

export default StartCommand;
