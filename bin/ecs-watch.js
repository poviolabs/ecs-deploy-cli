"use strict";
/*
 Watch a running ECS Service and its Tasks
 */
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const yargs_helper_1 = require("./yargs.helper");
const cli_helper_1 = __importStar(require("./cli.helper"));
const aws_helper_1 = require("./aws.helper");
class EcsWatchOptions extends yargs_helper_1.Options {
}
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "PWD", demandOption: true }),
    __metadata("design:type", String)
], EcsWatchOptions.prototype, "pwd", void 0);
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "STAGE", demandOption: true }),
    __metadata("design:type", String)
], EcsWatchOptions.prototype, "stage", void 0);
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "ECS_CLUSTER_NAME", demandOption: true }),
    __metadata("design:type", String)
], EcsWatchOptions.prototype, "ecsClusterName", void 0);
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "ECS_SERVICE_NAME" }),
    __metadata("design:type", String)
], EcsWatchOptions.prototype, "ecsServiceName", void 0);
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "AWS_REGION", demandOption: true }),
    __metadata("design:type", String)
], EcsWatchOptions.prototype, "awsRegion", void 0);
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "VERBOSE", default: false }),
    __metadata("design:type", Boolean)
], EcsWatchOptions.prototype, "verbose", void 0);
__decorate([
    (0, yargs_helper_1.Option)({ default: 10, describe: "Time in seconds between checks" }),
    __metadata("design:type", Number)
], EcsWatchOptions.prototype, "delay", void 0);
exports.command = {
    command: "watch",
    describe: "Watch the ECS Service",
    builder: async (y) => {
        return y
            .options((0, yargs_helper_1.getYargsOptions)(EcsWatchOptions))
            .middleware(async (_argv) => {
            return new EcsWatchOptions(await _argv, true);
        }, true);
    },
    handler: async (_argv) => {
        const argv = (await _argv);
        cli_helper_1.default.notice(`Watching ${argv.ecsServiceName}`);
        await (0, aws_helper_1.ecsWatch)({
            region: argv.awsRegion,
            cluster: argv.ecsClusterName,
            service: argv.ecsServiceName,
        }, (message) => {
            switch (message.type) {
                case "deployment":
                    const d = message.deployment;
                    console.log(`[${cli_helper_1.chk.yellow(d.taskDefinition.replace(/^[^\/]+/, ""))} ${d.status} Running ${d.runningCount}/${d.desiredCount} Pending ${d.pendingCount} Rollout ${d.rolloutState}`);
                    break;
                case "message":
                    console.log(`[${cli_helper_1.chk.magenta(message.source)} ${message.createdAt.toISOString()}] ${message.message}`);
                    break;
            }
        }).promise;
    },
};
