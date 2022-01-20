"use strict";
/*
 Deploy an image from ECR to ECS Fargate
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const semver_1 = __importDefault(require("semver"));
const git_helper_1 = require("./git.helper");
const yargs_helper_1 = require("./yargs.helper");
const cli_helper_1 = __importStar(require("./cli.helper"));
const aws_helper_1 = require("./aws.helper");
class EcsDeployOptions extends yargs_helper_1.Options {
}
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "PWD", demandOption: true }),
    __metadata("design:type", String)
], EcsDeployOptions.prototype, "pwd", void 0);
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "STAGE", demandOption: true }),
    __metadata("design:type", String)
], EcsDeployOptions.prototype, "stage", void 0);
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "RELEASE", demandOption: true }),
    __metadata("design:type", String)
], EcsDeployOptions.prototype, "release", void 0);
__decorate([
    (0, yargs_helper_1.Option)({
        envAlias: "RELEASE_STRATEGY",
        default: "gitsha",
        choices: ["gitsha", "gitsha-stage"],
        type: "string",
    }),
    __metadata("design:type", String)
], EcsDeployOptions.prototype, "releaseStrategy", void 0);
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "AWS_REPO_NAME", demandOption: true }),
    __metadata("design:type", String)
], EcsDeployOptions.prototype, "ecrRepoName", void 0);
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "ECS_TASK_FAMILY", demandOption: true }),
    __metadata("design:type", String)
], EcsDeployOptions.prototype, "ecsTaskFamily", void 0);
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "ECS_CLUSTER_NAME", demandOption: true }),
    __metadata("design:type", String)
], EcsDeployOptions.prototype, "ecsClusterName", void 0);
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "ECS_SERVICE_NAME", demandOption: true }),
    __metadata("design:type", String)
], EcsDeployOptions.prototype, "ecsServiceName", void 0);
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "AWS_REGION", demandOption: true }),
    __metadata("design:type", String)
], EcsDeployOptions.prototype, "awsRegion", void 0);
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "AWS_ACCOUNT_ID", demandOption: true }),
    __metadata("design:type", String)
], EcsDeployOptions.prototype, "awsAccountId", void 0);
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "CI" }),
    __metadata("design:type", Boolean)
], EcsDeployOptions.prototype, "ci", void 0);
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "SKIP_ECR_EXISTS_CHECK" }),
    __metadata("design:type", Boolean)
], EcsDeployOptions.prototype, "skipEcrExistsCheck", void 0);
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "VERBOSE", default: false }),
    __metadata("design:type", Boolean)
], EcsDeployOptions.prototype, "verbose", void 0);
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "VERSION", type: "string" }),
    __metadata("design:type", String)
], EcsDeployOptions.prototype, "ecsVersion", void 0);
__decorate([
    (0, yargs_helper_1.Option)({
        envAlias: "PREVIOUS_VERSION",
        type: "string",
        describe: "The version to base the next revision on",
    }),
    __metadata("design:type", String)
], EcsDeployOptions.prototype, "ecsPreviousVersion", void 0);
exports.command = {
    command: "deploy",
    describe: "Deploy the ECR Image to ECS",
    builder: async (y) => {
        return y
            .options((0, yargs_helper_1.getYargsOptions)(EcsDeployOptions))
            .middleware(async (_argv) => {
            const argv = new EcsDeployOptions(await _argv, true);
            argv.release = argv.release || await (0, git_helper_1.getRelease)(argv.pwd, argv.releaseStrategy);
            return argv;
        }, true);
    },
    handler: async (_argv) => {
        const argv = (await _argv);
        await cli_helper_1.default.printEnvironment(argv);
        cli_helper_1.default.banner("Deploy Environment");
        cli_helper_1.default.variable("AWS_REPO_NAME", argv.ecrRepoName);
        cli_helper_1.default.variable("ECS_TASK_FAMILY", argv.ecsTaskFamily);
        cli_helper_1.default.variable("ECS_CLUSTER_NAME", argv.ecsClusterName);
        cli_helper_1.default.variable("ECS_SERVICE_NAME", argv.ecsServiceName);
        // load ECR details
        const imageName = `${argv.awsAccountId}.dkr.ecr.${argv.awsRegion}.amazonaws.com/${argv.ecrRepoName}:${argv.release}`;
        cli_helper_1.default.info(`Image name: ${imageName}`);
        if (!argv.skipEcrExistsCheck) {
            if (!(await (0, aws_helper_1.ecrImageExists)({
                region: argv.awsRegion,
                repositoryName: argv.ecrRepoName,
                imageIds: [{ imageTag: argv.release }],
            }))) {
                throw new Error("ECR image does not exist");
            }
        }
        cli_helper_1.default.info("Getting latest task definition..");
        if (argv.ecsPreviousVersion) {
            cli_helper_1.default.notice(`Basing next version on version ${argv.ecsTaskFamily}:${argv.ecsPreviousVersion}`);
        }
        const previousTaskDefinition = await (0, aws_helper_1.ecsGetCurrentTaskDefinition)({
            region: argv.awsRegion,
            taskDefinition: argv.ecsPreviousVersion
                ? `${argv.ecsTaskFamily}:${argv.ecsPreviousVersion}`
                : argv.ecsTaskFamily,
        });
        if (previousTaskDefinition.containerDefinitions.length != 1) {
            // this could be handled somehow
            throw new Error("Task definition contains none or more than 1 tasks");
        }
        const previousContainerDefinition = previousTaskDefinition.containerDefinitions[0];
        let version = argv.ecsVersion;
        if (!version) {
            const previousVersion = previousContainerDefinition.environment?.find((x) => x.name === "VERSION")?.value;
            if (previousVersion) {
                const cleanedVersion = semver_1.default.clean(previousVersion.replace(/^([^0-9]+)/, ""));
                if (!cleanedVersion) {
                    cli_helper_1.default.warning("Version could not be parsed");
                }
                else {
                    // Make the version ${stage}-0.0.1
                    version = `${argv.stage}-${semver_1.default.inc(cleanedVersion, "patch")}`;
                    cli_helper_1.default.info("Incrementing version");
                }
            }
            else {
                cli_helper_1.default.notice("No version provided");
            }
        }
        else {
            cli_helper_1.default.variable("VERSION", version);
        }
        //  Get previous environment
        const environmentDict = previousContainerDefinition.environment.reduce((acc, cur) => {
            acc[cur.name] = cur.value;
            return acc;
        }, {});
        if (version) {
            environmentDict.VERSION = version;
        }
        // Get previous secret pointers
        const secretsDict = previousContainerDefinition.secrets.reduce((acc, cur) => {
            acc[cur.name] = cur.valueFrom;
            return acc;
        }, {});
        // inject secret SSM/SM from ENV
        for (const [k, v] of Object.entries(process.env).filter(([k, v]) => {
            return k.endsWith("__FROM");
        })) {
            secretsDict[k.replace(/__FROM$/, "")] = v;
        }
        const taskDefinitionRequest = {
            containerDefinitions: [
                {
                    ...previousContainerDefinition,
                    image: imageName,
                    environment: Object.entries(environmentDict).map(([k, v]) => ({
                        name: k,
                        value: v,
                    })),
                    secrets: Object.entries(secretsDict).map(([k, v]) => ({
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
        cli_helper_1.default.banner("Container Definition Diff");
        cli_helper_1.default.printDiff(previousContainerDefinition, taskDefinitionRequest.containerDefinitions[0]);
        cli_helper_1.default.banner("Update task definition & service");
        if (!argv.ci) {
            if (!(await cli_helper_1.default.confirm("Press enter to deploy task to ECS..."))) {
                cli_helper_1.default.info("Canceled");
                return;
            }
        }
        cli_helper_1.default.info("Creating new task..");
        const taskDefinition = await (0, aws_helper_1.ecsRegisterTaskDefinition)({
            region: argv.awsRegion,
            taskDefinitionRequest,
        });
        cli_helper_1.default.banner("Task Definition Diff");
        cli_helper_1.default.printDiff(taskDefinition, previousTaskDefinition);
        cli_helper_1.default.info(`Updating service task to revision ${taskDefinition.revision}...`);
        await (0, aws_helper_1.ecsUpdateService)({
            region: argv.awsRegion,
            service: argv.ecsServiceName,
            cluster: argv.ecsClusterName,
            taskDefinition: taskDefinition.taskDefinitionArn,
        });
        if (!argv.ci) {
            cli_helper_1.default.success(`Service updated. You can exit by using CTRL-C now.`);
            cli_helper_1.default.banner("Service Monitor");
            const watch = (0, aws_helper_1.ecsWatch)({
                region: argv.awsRegion,
                cluster: argv.ecsClusterName,
                service: argv.ecsServiceName,
            }, (message) => {
                switch (message.type) {
                    case "services":
                        if (!message.services.some((x) => x.deployments.some((d) => d.desiredCount !== d.runningCount ||
                            d.rolloutState !== "COMPLETED"))) {
                            cli_helper_1.default.success("Service successfully deployed!");
                            watch.stop();
                        }
                        break;
                    case "deployment":
                        const d = message.deployment;
                        console.log(`[${cli_helper_1.chk.yellow(d.taskDefinition.replace(/^[^\/]+/, ""))} ${d.status} Running ${d.runningCount}/${d.desiredCount} Pending ${d.pendingCount} Rollout ${d.rolloutState}`);
                        break;
                    default:
                        console.log(`[${cli_helper_1.chk.magenta(message.source)} ${message.createdAt.toISOString()}] ${message.message}`);
                        break;
                }
            });
            await watch.promise;
        }
    },
};
