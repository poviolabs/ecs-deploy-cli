"use strict";
/*
 Deploy an image from ECR to ECS Fargate
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
const semver_1 = require("semver");
const node_stage_1 = require("@povio/node-stage");
const yargs_1 = require("@povio/node-stage/yargs");
const cli_1 = require("@povio/node-stage/cli");
const chalk_1 = require("@povio/node-stage/chalk");
const aws_helper_1 = require("../helpers/aws.helper");
const diff_helper_1 = require("../helpers/diff.helper");
const version_helper_1 = require("../helpers/version.helper");
class EcsDeployOptions {
}
__decorate([
    (0, yargs_1.Option)({ envAlias: "PWD", demandOption: true }),
    __metadata("design:type", String)
], EcsDeployOptions.prototype, "pwd", void 0);
__decorate([
    (0, yargs_1.Option)({ envAlias: "STAGE", demandOption: true }),
    __metadata("design:type", String)
], EcsDeployOptions.prototype, "stage", void 0);
__decorate([
    (0, yargs_1.Option)({ envAlias: "SERVICE" }),
    __metadata("design:type", String)
], EcsDeployOptions.prototype, "service", void 0);
__decorate([
    (0, yargs_1.Option)({ envAlias: "RELEASE", demandOption: true }),
    __metadata("design:type", String)
], EcsDeployOptions.prototype, "release", void 0);
__decorate([
    (0, yargs_1.Option)({
        envAlias: "RELEASE_STRATEGY",
        default: "gitsha",
        choices: ["gitsha", "gitsha-stage"],
        type: "string",
    }),
    __metadata("design:type", String)
], EcsDeployOptions.prototype, "releaseStrategy", void 0);
__decorate([
    (0, yargs_1.Option)({ envAlias: "AWS_REPO_NAME", demandOption: true }),
    __metadata("design:type", String)
], EcsDeployOptions.prototype, "ecrRepoName", void 0);
__decorate([
    (0, yargs_1.Option)({ envAlias: "ECS_TASK_FAMILY", demandOption: true }),
    __metadata("design:type", String)
], EcsDeployOptions.prototype, "ecsTaskFamily", void 0);
__decorate([
    (0, yargs_1.Option)({ envAlias: "ECS_CLUSTER_NAME", demandOption: true }),
    __metadata("design:type", String)
], EcsDeployOptions.prototype, "ecsClusterName", void 0);
__decorate([
    (0, yargs_1.Option)({ envAlias: "ECS_SERVICE_NAME", demandOption: true }),
    __metadata("design:type", String)
], EcsDeployOptions.prototype, "ecsServiceName", void 0);
__decorate([
    (0, yargs_1.Option)({ envAlias: "AWS_REGION", demandOption: true }),
    __metadata("design:type", String)
], EcsDeployOptions.prototype, "awsRegion", void 0);
__decorate([
    (0, yargs_1.Option)({ envAlias: "AWS_ACCOUNT_ID", demandOption: true }),
    __metadata("design:type", String)
], EcsDeployOptions.prototype, "awsAccountId", void 0);
__decorate([
    (0, yargs_1.Option)({ envAlias: "CI" }),
    __metadata("design:type", Boolean)
], EcsDeployOptions.prototype, "ci", void 0);
__decorate([
    (0, yargs_1.Option)({ envAlias: "SKIP_ECR_EXISTS_CHECK" }),
    __metadata("design:type", Boolean)
], EcsDeployOptions.prototype, "skipEcrExistsCheck", void 0);
__decorate([
    (0, yargs_1.Option)({ envAlias: "VERBOSE", default: false }),
    __metadata("design:type", Boolean)
], EcsDeployOptions.prototype, "verbose", void 0);
__decorate([
    (0, yargs_1.Option)({ envAlias: "VERSION", type: "string", alias: "ecsVersion" }),
    __metadata("design:type", String)
], EcsDeployOptions.prototype, "appVersion", void 0);
__decorate([
    (0, yargs_1.Option)({
        type: "string",
        describe: "The version to base the next revision on",
    }),
    __metadata("design:type", String)
], EcsDeployOptions.prototype, "ecsBaseTaskVersion", void 0);
exports.command = {
    command: "deploy",
    describe: "Deploy the ECR Image to ECS",
    builder: async (y) => {
        return y
            .options((0, yargs_1.getYargsOptions)(EcsDeployOptions))
            .middleware(async (_argv) => {
            return (await (0, yargs_1.loadYargsConfig)(EcsDeployOptions, _argv, "ecsDeploy"));
        }, true);
    },
    handler: async (_argv) => {
        const argv = (await _argv);
        await (0, chalk_1.loadColors)();
        (0, cli_1.logBanner)(`EcsBuild ${(0, version_helper_1.getVersion)()}`);
        for (const [k, v] of Object.entries(await (0, cli_1.getToolEnvironment)(argv))) {
            (0, cli_1.logVariable)(k, v);
        }
        (0, cli_1.logBanner)("Deploy Environment");
        (0, cli_1.logVariable)("ecrRepoName", argv.ecrRepoName);
        (0, cli_1.logVariable)("ecsTaskFamily", argv.ecsTaskFamily);
        (0, cli_1.logVariable)("ecsClusterName", argv.ecsClusterName);
        (0, cli_1.logVariable)("ecsServiceName", argv.ecsServiceName);
        // load ECR details
        const imageName = `${argv.awsAccountId}.dkr.ecr.${argv.awsRegion}.amazonaws.com/${argv.ecrRepoName}:${argv.release}`;
        (0, cli_1.logInfo)(`Image name: ${imageName}`);
        if (!argv.skipEcrExistsCheck) {
            if (!(await (0, aws_helper_1.ecrImageExists)({
                region: argv.awsRegion,
                repositoryName: argv.ecrRepoName,
                imageIds: [{ imageTag: argv.release }],
            }))) {
                throw new Error("ECR image does not exist");
            }
        }
        (0, cli_1.logInfo)("Getting latest task definition..");
        if (argv.ecsBaseTaskVersion) {
            (0, cli_1.logNotice)(`Basing next version on version ${argv.ecsTaskFamily}:${argv.ecsBaseTaskVersion}`);
        }
        const previousTaskDefinition = await (0, aws_helper_1.ecsGetCurrentTaskDefinition)({
            region: argv.awsRegion,
            taskDefinition: argv.ecsBaseTaskVersion
                ? `${argv.ecsTaskFamily}:${argv.ecsBaseTaskVersion}`
                : argv.ecsTaskFamily,
        });
        if (previousTaskDefinition?.containerDefinitions?.length != 1) {
            // this could be handled somehow
            throw new Error("Task definition contains none or more than 1 tasks");
        }
        const previousContainerDefinition = previousTaskDefinition.containerDefinitions[0];
        const globalPrefix = process.env.CONFIG_PREFIX || "app";
        if (!previousContainerDefinition.environment) {
            throw new Error("Task definition missing environment");
        }
        //  get previous environment
        const taskDefinitionContainerEnvironment = previousContainerDefinition.environment.reduce((acc, cur) => {
            if (cur.name) {
                // @ts-ignore
                acc[cur.name] = cur.value;
            }
            return acc;
        }, {});
        let version = argv.appVersion;
        if (!version) {
            const previousVersion = taskDefinitionContainerEnvironment[`${globalPrefix}__version`];
            if (previousVersion) {
                const cleanedVersion = (0, semver_1.clean)(previousVersion.replace(/^([^0-9]+)/, ""));
                if (!cleanedVersion) {
                    (0, cli_1.logWarning)("Version could not be parsed");
                }
                else {
                    // make the version ${stage}-0.0.1
                    version = `${argv.stage}-${(0, semver_1.inc)(cleanedVersion, "patch")}`;
                    (0, cli_1.logInfo)("Incrementing version");
                }
            }
            else {
                (0, cli_1.logNotice)("No version provided");
            }
        }
        else {
            (0, cli_1.logVariable)(`${globalPrefix}__version`, version);
        }
        // override task container env from config.yaml
        if (argv.config.ecsEnv && typeof argv.config.ecsEnv === "object") {
            for (const [envKey, envValue] of Object.entries(argv.config.ecsEnv)) {
                taskDefinitionContainerEnvironment[envKey] = envValue;
            }
        }
        // override version
        if (version) {
            taskDefinitionContainerEnvironment[`${globalPrefix}__version`] = version;
        }
        // check/set stage
        if (!taskDefinitionContainerEnvironment[`${globalPrefix}__stage`]) {
            taskDefinitionContainerEnvironment[`${globalPrefix}__stage`] = argv.stage;
        }
        else if (taskDefinitionContainerEnvironment[`${globalPrefix}__stage`] !==
            argv.stage) {
            throw new Error(`Stage mismatch - tried to deploy to ${taskDefinitionContainerEnvironment[`${globalPrefix}__stage`]}`);
        }
        // get previous secret pointers
        const taskDefinitionContainerSecrets = previousContainerDefinition.secrets
            ? previousContainerDefinition.secrets.reduce((acc, cur) => {
                if (cur.name) {
                    // @ts-ignore
                    acc[cur.name] = cur.valueFrom;
                }
                return acc;
            }, {})
            : {};
        // override task container secrets from config.yaml
        if (argv.config.ecsSecrets && typeof argv.config.ecsSecrets === "object") {
            for (const [secretKey, secretFrom] of Object.entries(argv.config.ecsSecrets)) {
                taskDefinitionContainerSecrets[secretKey] = secretFrom;
            }
        }
        const taskDefinitionRequest = {
            containerDefinitions: [
                {
                    ...previousContainerDefinition,
                    image: imageName,
                    environment: Object.entries(taskDefinitionContainerEnvironment).map(([k, v]) => ({
                        name: k,
                        value: v,
                    })),
                    secrets: Object.entries(taskDefinitionContainerSecrets).map(([k, v]) => ({
                        name: k,
                        valueFrom: v,
                    })),
                },
            ],
            family: previousTaskDefinition.family,
            taskRoleArn: previousTaskDefinition.taskRoleArn,
            executionRoleArn: previousTaskDefinition.executionRoleArn,
            networkMode: previousTaskDefinition.networkMode,
            volumes: previousTaskDefinition.volumes,
            placementConstraints: previousTaskDefinition.placementConstraints,
            requiresCompatibilities: previousTaskDefinition.requiresCompatibilities,
            cpu: previousTaskDefinition.cpu,
            memory: previousTaskDefinition.memory,
        };
        (0, cli_1.logBanner)("Container Definition Diff");
        (0, diff_helper_1.printDiff)(previousContainerDefinition, taskDefinitionRequest?.containerDefinitions?.[0] || {});
        (0, cli_1.logBanner)("Update task definition & service");
        if (!argv.ci) {
            if (!(await (0, cli_1.confirm)("Press enter to deploy task to ECS..."))) {
                (0, cli_1.logInfo)("Canceled");
                return;
            }
        }
        (0, cli_1.logInfo)("Creating new task..");
        const taskDefinition = await (0, aws_helper_1.ecsRegisterTaskDefinition)({
            region: argv.awsRegion,
            taskDefinitionRequest,
        });
        if (!taskDefinition || !taskDefinition.taskDefinitionArn) {
            console.log({ taskDefinition: JSON.stringify(taskDefinition) });
            // this can't really happen, the call above should error out
            throw new Error("Task could not be registered.");
        }
        (0, cli_1.logBanner)("Task Definition Diff");
        (0, diff_helper_1.printDiff)(taskDefinition, previousTaskDefinition);
        (0, cli_1.logInfo)(`Updating service task to revision ${taskDefinition.revision}...`);
        await (0, aws_helper_1.ecsUpdateService)({
            region: argv.awsRegion,
            service: argv.ecsServiceName,
            cluster: argv.ecsClusterName,
            taskDefinition: taskDefinition.taskDefinitionArn,
        });
        if (!argv.ci) {
            (0, cli_1.logSuccess)(`Service updated. You can exit by using CTRL-C now.`);
            (0, cli_1.logBanner)("Service Monitor");
            const watch = (0, aws_helper_1.ecsWatch)({
                region: argv.awsRegion,
                cluster: argv.ecsClusterName,
                service: argv.ecsServiceName,
            }, (message) => {
                switch (message.type) {
                    case "services":
                        if (!message.services.some((x) => x?.deployments?.some((d) => d.desiredCount !== d.runningCount ||
                            d.rolloutState !== "COMPLETED"))) {
                            (0, cli_1.logSuccess)("Service successfully deployed!");
                            watch.stop();
                        }
                        break;
                    case "deployment":
                        const d = message.deployment;
                        console.log(`[${chalk_1.chk.yellow(d.taskDefinition?.replace(/^[^\/]+/, ""))} ${d.status} Running ${d.runningCount}/${d.desiredCount} Pending ${d.pendingCount} Rollout ${d.rolloutState}`);
                        break;
                    default:
                        console.log(`[${chalk_1.chk.magenta(message.source)} ${message.createdAt.toISOString()}] ${message.message}`);
                        break;
                }
            });
            await watch.promise;
        }
    },
};
//# sourceMappingURL=ecs-deploy.command.js.map