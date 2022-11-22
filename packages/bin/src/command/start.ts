import yargs from 'yargs';


const StartCommand: yargs.CommandModule = {
  builder: (argv: yargs.Argv) => {
    return argv.array('bridge');
  },
  command: 'start',
  describe: 'Start alarmmgr monitor',
  handler: async (args: yargs.Arguments) => {
    const {bridge} = args;
    console.log(`start with bridges -> ${bridge}`);
    // await probe.start();
  },
}

export default StartCommand;
