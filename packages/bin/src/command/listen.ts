import yargs from 'yargs';
import {ListenHandler} from "../handler/listen";


const StartCommand: yargs.CommandModule = {
  builder: (argv: yargs.Argv) => {
    return argv.array('probe');
  },
  command: 'listen',
  describe: 'Probe listen',
  handler: async (args: yargs.Arguments) => {
    const {probe} = args;
    const handler = new ListenHandler(probe as unknown as Array<string>);
    await handler.start();
  },
}

export default StartCommand;
