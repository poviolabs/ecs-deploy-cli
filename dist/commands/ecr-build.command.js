"use strict";
/*
 Build the Docker image and deploy it to ECR
  - Skip building if the release (git version) already exists
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const path_1 = __importDefault(require("path"));
const node_stage_1 = require("@povio/node-stage");
const yargs_1 = require("@povio/node-stage/yargs");
const cli_1 = require("@povio/node-stage/cli");
const chalk_1 = require("@povio/node-stage/chalk");
const git_1 = require("@povio/node-stage/git");
const version_helper_1 = require("../helpers/version.helper");
const aws_helper_1 = require("../helpers/aws.helper");
const docker_helper_1 = require("../helpers/docker.helper");
class EcrBuildOptions {
}
__decorate([
    (0, yargs_1.Option)({ envAlias: "PWD", demandOption: true }),
    __metadata("design:type", String)
], EcrBuildOptions.prototype, "pwd", void 0);
__decorate([
    (0, yargs_1.Option)({ envAlias: "STAGE" }),
    __metadata("design:type", String)
], EcrBuildOptions.prototype, "stage", void 0);
__decorate([
    (0, yargs_1.Option)({ envAlias: "RELEASE", demandOption: true }),
    __metadata("design:type", String)
], EcrBuildOptions.prototype, "release", void 0);
__decorate([
    (0, yargs_1.Option)({
        envAlias: "RELEASE_STRATEGY",
        default: "gitsha",
        choices: ["gitsha", "gitsha-stage"],
        type: "string",
    }),
    __metadata("design:type", String)
], EcrBuildOptions.prototype, "releaseStrategy", void 0);
__decorate([
    (0, yargs_1.Option)({
        envAlias: "AWS_REPO_NAME",
        demandOption: true,
        alias: ["awsRepoName"],
    }),
    __metadata("design:type", String)
], EcrBuildOptions.prototype, "ecrRepoName", void 0);
__decorate([
    (0, yargs_1.Option)({ describe: "Pull image from ECR to use as a base" }),
    __metadata("design:type", Boolean)
], EcrBuildOptions.prototype, "ecrCache", void 0);
__decorate([
    (0, yargs_1.Option)({ envAlias: "AWS_REGION", demandOption: true }),
    __metadata("design:type", String)
], EcrBuildOptions.prototype, "awsRegion", void 0);
__decorate([
    (0, yargs_1.Option)({ envAlias: "AWS_ACCOUNT_ID", demandOption: true }),
    __metadata("design:type", String)
], EcrBuildOptions.prototype, "awsAccountId", void 0);
__decorate([
    (0, yargs_1.Option)({ envAlias: "IGNORE_GIT_CHANGES" }),
    __metadata("design:type", Boolean)
], EcrBuildOptions.prototype, "ignoreGitChanges", void 0);
__decorate([
    (0, yargs_1.Option)({ envAlias: "CI" }),
    __metadata("design:type", Boolean)
], EcrBuildOptions.prototype, "ci", void 0);
__decorate([
    (0, yargs_1.Option)({ envAlias: "SKIP_ECR_EXISTS_CHECK" }),
    __metadata("design:type", Boolean)
], EcrBuildOptions.prototype, "skipEcrExistsCheck", void 0);
__decorate([
    (0, yargs_1.Option)({ envAlias: "DOCKERFILE_PATH", default: "Dockerfile" }),
    __metadata("design:type", String)
], EcrBuildOptions.prototype, "dockerfilePath", void 0);
__decorate([
    (0, yargs_1.Option)({ envAlias: "DOCKERFILE_CONTEXT" }),
    __metadata("design:type", String)
], EcrBuildOptions.prototype, "dockerfileContext", void 0);
__decorate([
    (0, yargs_1.Option)({
    // requires Docker daemon API  version 1.38
    // default: "linux/amd64"
    }),
    __metadata("design:type", String)
], EcrBuildOptions.prototype, "platform", void 0);
__decorate([
    (0, yargs_1.Option)({ default: false }),
    __metadata("design:type", Boolean)
], EcrBuildOptions.prototype, "buildx", void 0);
__decorate([
    (0, yargs_1.Option)({ default: false }),
    __metadata("design:type", Boolean)
], EcrBuildOptions.prototype, "skipPush", void 0);
__decorate([
    (0, yargs_1.Option)({ envAlias: "VERBOSE", default: false }),
    __metadata("design:type", Boolean)
], EcrBuildOptions.prototype, "verbose", void 0);
exports.command = {
    command: "build",
    describe: "Build and Push the ECR Image",
    builder: async (y) => {
        return y
            .options((0, yargs_1.getYargsOptions)(EcrBuildOptions))
            .middleware(async (_argv) => {
            return (await (0, yargs_1.loadYargsConfig)(EcrBuildOptions, _argv, "ecsDeploy"));
        }, true);
    },
    handler: async (_argv) => {
        const argv = (await _argv);
        await (0, chalk_1.loadColors)();
        (0, cli_1.logBanner)(`EcsDeploy ${(0, version_helper_1.getVersion)()}`);
        for (const [k, v] of Object.entries(await (0, cli_1.getToolEnvironment)(argv))) {
            (0, cli_1.logVariable)(k, v);
        }
        (0, cli_1.logBanner)("Build Environment");
        if (!argv.ci) {
            (0, cli_1.logInfo)("Running Interactively");
        }
        const gitChanges = await (0, git_1.getGitChanges)(argv.pwd);
        if (gitChanges !== "") {
            if (argv.ignoreGitChanges) {
                (0, cli_1.logWarning)("Changes detected in .git");
            }
            else {
                if (gitChanges === undefined) {
                    (0, cli_1.logError)("Error detecting Git");
                }
                else {
                    (0, cli_1.logBanner)("Detected Changes in Git - Stage must be clean to build!");
                    console.log(gitChanges);
                }
                process.exit(1);
            }
        }
        const docker = new docker_helper_1.Docker({
            verbose: argv.verbose,
            cwd: argv.pwd,
            env: Object.entries(process.env)
                .filter((x) => x[0].startsWith("DOCKER_"))
                .reduce((acc, [key, value]) => {
                acc[key] = value;
                return acc;
            }, {}),
        });
        (0, cli_1.logVariable)("release", argv.release);
        (0, cli_1.logInfo)(`Docker Version: ${(await docker.version()).data}`);
        // load ECR details
        const imageName = `${argv.awsAccountId}.dkr.ecr.${argv.awsRegion}.amazonaws.com/${argv.ecrRepoName}:${argv.release}`;
        (0, cli_1.logInfo)(`Image name: ${imageName}`);
        (0, cli_1.logInfo)("Setting up AWS Docker Auth...");
        const identity = await (0, aws_helper_1.getAwsIdentity)({ region: argv.awsRegion });
        (0, cli_1.logInfo)(`AWS User Arn: ${identity.Arn}`);
        const ecrCredentials = await (0, aws_helper_1.ecrGetDockerCredentials)({
            region: argv.awsRegion,
        });
        await docker.login({
            serveraddress: ecrCredentials.endpoint,
            username: "AWS",
            password: ecrCredentials.password,
        });
        (0, cli_1.logInfo)("AWS ECR Docker Login succeeded");
        // check if image already exists
        if (!argv.skipEcrExistsCheck) {
            if (await (0, aws_helper_1.ecrImageExists)({
                region: argv.awsRegion,
                repositoryName: argv.ecrRepoName,
                imageIds: [{ imageTag: argv.release }],
            })) {
                (0, cli_1.logInfo)("Image already exists");
                return;
            }
        }
        // load previous image to speed up build
        let previousImageName;
        if (argv.ecrCache) {
            if (argv.buildx) {
                throw new Error("Buildx can not be used with ECR Cache");
            }
            // use the previous image for cache
            const previousImageTag = await (0, aws_helper_1.ecrGetLatestImageTag)({
                region: argv.awsRegion,
                repositoryName: argv.ecrRepoName,
            });
            previousImageName = `${argv.awsAccountId}.dkr.ecr.${argv.awsRegion}.amazonaws.com/${argv.ecrRepoName}:${previousImageTag}`;
            (0, cli_1.logInfo)(`Using cache image: ${previousImageName}`);
            await docker.imagePull(imageName, { verbose: true });
        }
        const dockerfileContext = path_1.default.resolve(argv.dockerfileContext || argv.pwd);
        const dockerfilePath = path_1.default.join(dockerfileContext, argv.dockerfilePath);
        if (argv.dockerfileContext || argv.dockerfilePath !== "Dockerfile") {
            (0, cli_1.logNotice)(`Dockerfile context: ${dockerfileContext}`);
            (0, cli_1.logNotice)(`Dockerfile path: ${dockerfilePath}`);
        }
        // next.js needs to have per stage build time variables
        //  check that we are not reusing the image in multiple stages
        if (argv.config.ecsDockerEnv) {
            if (argv.releaseStrategy === "gitsha") {
                throw new Error("Docker environment injection can not be used with releaseStrategy=gitsha");
            }
        }
        // build image
        if (argv.buildx || !(await docker.imageExists(imageName)).data) {
            (0, cli_1.logInfo)("Building docker image");
            await docker.imageBuild({
                imageName,
                src: [dockerfilePath],
                buildargs: {
                    RELEASE: argv.release,
                    ...(argv.config.ecsDockerEnv ? argv.config.ecsDockerEnv : {}),
                },
                context: dockerfileContext,
                previousImageName,
                buildx: argv.buildx,
                platform: argv.platform,
                push: argv.buildx && !argv.skipPush,
            }, { verbose: true });
        }
        if (!argv.skipPush) {
            if (!argv.buildx) {
                (0, cli_1.logInfo)("Pushing to ECR...");
                await docker.imagePush(imageName, { verbose: true });
            }
            (0, cli_1.logInfo)(`Done! Deploy the service with  ${chalk_1.chk.magenta(`yarn ecs-deploy-cli deploy --stage ${argv.stage}`)}`);
        }
    },
};
//# sourceMappingURL=ecr-build.command.js.map