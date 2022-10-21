#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const cli_1 = require("@povio/node-stage/cli");
const ecr_build_command_1 = require("./commands/ecr-build.command");
const ecs_deploy_command_1 = require("./commands/ecs-deploy.command");
const ecs_watch_command_1 = require("./commands/ecs-watch.command");
const version_helper_1 = require("./helpers/version.helper");
(0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
    .version((0, version_helper_1.getVersion)() || "unknown")
    .scriptName("ecs-deploy-cli")
    .command(ecr_build_command_1.command)
    .command(ecs_deploy_command_1.command)
    .command(ecs_watch_command_1.command)
    .help()
    .demandCommand(1)
    .strictCommands(true)
    .showHelpOnFail(true)
    .fail((msg, err, yargs) => {
    if (msg)
        (0, cli_1.logError)(msg);
    if (err) {
        if (!!process.env.VERBOSE) {
            console.error(err);
        }
        else {
            (0, cli_1.logError)(err.message);
        }
    }
    (0, cli_1.logInfo)("Use '--help' for more info");
    process.exit(1);
})
    .parse();
//# sourceMappingURL=sh.js.map