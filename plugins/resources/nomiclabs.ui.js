const UI = require('./../../lib/ui').UI;

/**
 * Buidler Plugin logging
 */
class PluginUI extends UI {
  constructor(log){
    super(log);

    this.flags = {
      file:       `Path (or glob) defining a subset of tests to run`,

      solcoverjs: `Relative path from working directory to config. ` +
                  `Useful for monorepo packages that share settings.`,

      temp:       `Path to a disposable folder to store compilation artifacts in. ` +
                  `Useful when your test setup scripts include hard-coded paths to ` +
                  `a build directory.`,

    }
  }

  /**
   * Writes a formatted message via log
   * @param  {String}   kind  message selector
   * @param  {String[]} args  info to inject into template
   */
  report(kind, args=[]){
    const c = this.chalk;
    const ct = c.bold.green('>');
    const ds = c.bold.yellow('>');
    const w = ":warning:";

    const kinds = {

      'instr-skip':  `\n${c.bold('Coverage skipped for:')}` +
                     `\n${c.bold('=====================')}\n`,

      'instr-skipped': `${ds} ${c.grey(args[0])}`,

      'versions':  `${ct} ${c.bold('ganache-core')}:      ${args[0]}\n` +
                   `${ct} ${c.bold('solidity-coverage')}: v${args[1]}`,

      'network': `\n${c.bold('Network Info')}` +
                 `\n${c.bold('============')}\n` +
                 `${ct} ${c.bold('port')}:    ${args[1]}\n` +
                 `${ct} ${c.bold('network')}: ${args[0]}\n`,

      'port-clash': `${w}  ${c.red("The 'port' values in your Buidler url ")}` +
                          `${c.red("and .solcover.js are different. Using Buidler's: ")} ${c.bold(args[0])}.\n`,

    }

    this._write(kinds[kind]);
  }

  /**
   * Returns a formatted message. Useful for error message.
   * @param  {String}   kind  message selector
   * @param  {String[]} args  info to inject into template
   * @return {String}         message
   */
  generate(kind, args=[]){
    const c = this.chalk;
    const x = ":x:";

    const kinds = {

      'sources-fail': `${c.red('Cannot locate expected contract sources folder: ')} ${args[0]}`,

      'solcoverjs-fail': `${c.red('Could not load .solcover.js config file. ')}` +
                         `${c.red('This can happen if it has a syntax error or ')}` +
                         `${c.red('the path you specified for it is wrong.')}`,

      'tests-fail': `${x} ${c.bold(args[0])} ${c.red('test(s) failed under coverage.')}`,


    }


    return this._format(kinds[kind])
  }
}

module.exports = PluginUI;