"use strict";
/*
 Watch a running ECS Service and its Tasks
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const yargs_1 = require("@povio/node-stage/yargs");
const cli_1 = require("@povio/node-stage/cli");
const chalk_1 = require("@povio/node-stage/chalk");
const aws_helper_1 = require("../helpers/aws.helper");
class EcsWatchOptions {
}
__decorate([
    (0, yargs_1.Option)({ envAlias: "PWD", demandOption: true }),
    __metadata("design:type", String)
], EcsWatchOptions.prototype, "pwd", void 0);
__decorate([
    (0, yargs_1.Option)({ envAlias: "STAGE", demandOption: true }),
    __metadata("design:type", String)
], EcsWatchOptions.prototype, "stage", void 0);
__decorate([
    (0, yargs_1.Option)({ envAlias: "ECS_CLUSTER_NAME", demandOption: true }),
    __metadata("design:type", String)
], EcsWatchOptions.prototype, "ecsClusterName", void 0);
__decorate([
    (0, yargs_1.Option)({ envAlias: "ECS_SERVICE_NAME" }),
    __metadata("design:type", String)
], EcsWatchOptions.prototype, "ecsServiceName", void 0);
__decorate([
    (0, yargs_1.Option)({ envAlias: "AWS_REGION", demandOption: true }),
    __metadata("design:type", String)
], EcsWatchOptions.prototype, "awsRegion", void 0);
__decorate([
    (0, yargs_1.Option)({ envAlias: "VERBOSE", default: false }),
    __metadata("design:type", Boolean)
], EcsWatchOptions.prototype, "verbose", void 0);
__decorate([
    (0, yargs_1.Option)({ default: 10, describe: "Time in seconds between checks" }),
    __metadata("design:type", Number)
], EcsWatchOptions.prototype, "delay", void 0);
exports.command = {
    command: "watch",
    describe: "Watch the ECS Service",
    builder: async (y) => {
        return y
            .options((0, yargs_1.getYargsOptions)(EcsWatchOptions))
            .middleware(async (_argv) => {
            return (await (0, yargs_1.loadYargsConfig)(EcsWatchOptions, _argv, "ecsDeploy"));
        }, true);
    },
    handler: async (_argv) => {
        const argv = (await _argv);
        await (0, chalk_1.loadColors)();
        (0, cli_1.logNotice)(`Watching ${argv.ecsServiceName}`);
        await (0, aws_helper_1.ecsWatch)({
            region: argv.awsRegion,
            cluster: argv.ecsClusterName,
            service: argv.ecsServiceName,
        }, (message) => {
            switch (message.type) {
                case "deployment":
                    const d = message.deployment;
                    console.log(`[${chalk_1.chk.yellow(d.taskDefinition?.replace(/^[^\/]+/, ""))} ${d.status} Running ${d.runningCount}/${d.desiredCount} Pending ${d.pendingCount} Rollout ${d.rolloutState}`);
                    break;
                case "message":
                    console.log(`[${chalk_1.chk.magenta(message.source)} ${message.createdAt.toISOString()}] ${message.message}`);
                    break;
            }
        }).promise;
    },
};
//# sourceMappingURL=ecs-watch.command.js.map