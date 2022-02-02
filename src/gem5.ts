import { DebugProtocol } from '@vscode/debugprotocol';
import { GDBServerController, ConfigurationArguments, createPortName } from './common';
import { EventEmitter } from 'events';

const commandExistsSync = require('command-exists').sync;
const EXECUTABLE_NAMES = ['gem5'];

export class Gem5ServerController extends EventEmitter implements GDBServerController {
    public portsNeeded: string[] = ['gdbPort'];
    public name: 'gem5';

    private args: ConfigurationArguments;
    private ports: { [name: string]: number };

    constructor() {
        super();
    }

    public setPorts(ports: { [name: string]: number }): void {
        this.ports = ports;
    }

    public setArguments(args: ConfigurationArguments): void {
        this.args = args;
    }

    public customRequest(command: string, response: DebugProtocol.Response, args: any): boolean {
        return false;
    }
    
    public initCommands(): string[] {
        const gdbport = this.ports[createPortName(this.args.targetProcessor)];

        return [
            `target-select extended-remote localhost:${gdbport}`
        ];
    }

    public launchCommands(): string[] {
        const commands = [
            'enable-pretty-printing'
        ];

        return commands;
    }

    public attachCommands(): string[] {
        const commands = [
            'enable-pretty-printing'
        ];
        
        return commands;
    }

    public restartCommands(): string[] {
        const commands: string[] = [
            'interpreter-exec console "monitor stop"',
            'interpreter-exec console "monitor system_reset"'
        ];

        return commands;
    }

    public swoAndRTTCommands(): string[] {
        return [];
    }

    public serverExecutable() {
        if (this.args.serverpath) { return this.args.serverpath; }
        else {
            for (const name in EXECUTABLE_NAMES) {
                if (commandExistsSync(name)) { return name; }
            }
            return 'gem5';
        }
    }
    
    public serverArguments(): string[] {
        const gdbport = this.ports['gdbPort'];

        let cmdargs = [
            '--listener-mode=on',
            `--remote-gdb-port=${gdbport}`,
            '--wait-gdb',
            this.args.ROM
        ];

        if (this.args.serverArgs) {
            cmdargs = cmdargs.concat(this.args.serverArgs);
        }

        return cmdargs;
    }

    public initMatch(): RegExp {
        return /Waiting for a remote GDB connection/g;
    }

    public serverLaunchStarted(): void {}
    public serverLaunchCompleted(): void {}
    public debuggerLaunchStarted(): void {}
    public debuggerLaunchCompleted(): void {}
}
