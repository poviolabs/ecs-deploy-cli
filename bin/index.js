#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ECS_DEPLOY_CLI = void 0;
exports.ECS_DEPLOY_CLI = "0.8";
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const ecs_build_1 = require("./ecs-build");
const ecs_deploy_1 = require("./ecs-deploy");
const ecs_watch_1 = require("./ecs-watch");
const cli = __importStar(require("./cli.helper"));
(0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
    .version(exports.ECS_DEPLOY_CLI)
    .command(ecs_build_1.command)
    .command(ecs_deploy_1.command)
    .command(ecs_watch_1.command)
    .help()
    .demandCommand(1)
    .strictCommands(true)
    .showHelpOnFail(true)
    .fail((msg, err, yargs) => {
    if (msg)
        cli.error(msg);
    if (err)
        throw err;
    cli.info("Use '--help' for more info");
    process.exit(1);
})
    .parse();
