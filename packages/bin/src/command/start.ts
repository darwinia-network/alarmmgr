import yargs from 'yargs';
import {StartHandler} from "../handler/start";


const StartCommand: yargs.CommandModule = {
  builder: (argv: yargs.Argv) => {
    return argv.array('bridge');
  },
  command: 'start',
  describe: 'Start alarmmgr monitor',
  handler: async (args: yargs.Arguments) => {
    const {bridge} = args;
    const handler = new StartHandler(bridge as unknown as Array<string>);
    await handler.start();
  },
}

export default StartCommand;
