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
const cli_helper_1 = __importDefault(require("./cli.helper"));
const git_helper_1 = require("./git.helper");
const yargs_helper_1 = require("./yargs.helper");
const aws_helper_1 = require("./aws.helper");
const docker_helper_1 = __importDefault(require("./docker.helper"));
class EcsBuildOptions extends yargs_helper_1.Options {
}
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "PWD", demandOption: true }),
    __metadata("design:type", String)
], EcsBuildOptions.prototype, "pwd", void 0);
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "STAGE" }),
    __metadata("design:type", String)
], EcsBuildOptions.prototype, "stage", void 0);
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "RELEASE", demandOption: true }),
    __metadata("design:type", String)
], EcsBuildOptions.prototype, "release", void 0);
__decorate([
    (0, yargs_helper_1.Option)({
        envAlias: "RELEASE_STRATEGY",
        default: "gitsha",
        choices: ["gitsha", "gitsha-stage"],
        type: "string",
    }),
    __metadata("design:type", String)
], EcsBuildOptions.prototype, "releaseStrategy", void 0);
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "AWS_REPO_NAME", demandOption: true }),
    __metadata("design:type", String)
], EcsBuildOptions.prototype, "ecrRepoName", void 0);
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "AWS_REGION", demandOption: true }),
    __metadata("design:type", String)
], EcsBuildOptions.prototype, "awsRegion", void 0);
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "AWS_ACCOUNT_ID", demandOption: true }),
    __metadata("design:type", String)
], EcsBuildOptions.prototype, "awsAccountId", void 0);
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "IGNORE_GIT_CHANGES" }),
    __metadata("design:type", Boolean)
], EcsBuildOptions.prototype, "ignoreGitChanges", void 0);
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "CI" }),
    __metadata("design:type", Boolean)
], EcsBuildOptions.prototype, "ci", void 0);
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "SKIP_ECR_EXISTS_CHECK" }),
    __metadata("design:type", Boolean)
], EcsBuildOptions.prototype, "skipEcrExistsCheck", void 0);
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "DOCKER_PATH", default: "Dockerfile" }),
    __metadata("design:type", String)
], EcsBuildOptions.prototype, "dockerPath", void 0);
__decorate([
    (0, yargs_helper_1.Option)({ envAlias: "VERBOSE", default: false }),
    __metadata("design:type", Boolean)
], EcsBuildOptions.prototype, "verbose", void 0);
exports.command = {
    command: "build",
    describe: "Build and Push the ECR Image",
    builder: async (y) => {
        return y
            .options((0, yargs_helper_1.getYargsOptions)(EcsBuildOptions))
            .middleware(async (_argv) => {
            const argv = new EcsBuildOptions(await _argv, true);
            if (!argv.release) {
                argv.release =
                    argv.releaseStrategy === "gitsha-stage"
                        ? `${await (0, git_helper_1.getRelease)(argv.pwd)}-${argv.stage}`
                        : await (0, git_helper_1.getRelease)(argv.pwd);
            }
            return argv;
        }, true);
    },
    handler: async (_argv) => {
        const argv = (await _argv);
        await cli_helper_1.default.printEnvironment(argv);
        cli_helper_1.default.banner("Build Environment");
        const isPristine = await (0, git_helper_1.getIsPristine)(argv.pwd);
        if (isPristine) {
            if (argv.ignoreGitChanges) {
                cli_helper_1.default.warning("Changes detected in .git");
            }
            else {
                throw new Error("Detected un-committed code in git");
            }
        }
        cli_helper_1.default.variable("RELEASE", argv.release);
        // load ECR details
        const imageName = `${argv.awsAccountId}.dkr.ecr.${argv.awsRegion}.amazonaws.com/${argv.ecrRepoName}:${argv.release}`;
        cli_helper_1.default.info(`Image name: ${imageName}`);
        if (!argv.skipEcrExistsCheck) {
            if (await (0, aws_helper_1.ecrImageExists)({
                region: argv.awsRegion,
                repositoryName: argv.ecrRepoName,
                imageIds: [{ imageTag: argv.release }],
            })) {
                cli_helper_1.default.info("Image already exists");
                return;
            }
        }
        cli_helper_1.default.banner("Build Step");
        if (argv.dockerPath !== "Dockerfile") {
            cli_helper_1.default.variable("DOCKER_PATH", argv.dockerPath, "Dockerfile");
        }
        cli_helper_1.default.variable("DOCKER_VERSION", await docker_helper_1.default.version());
        if (await docker_helper_1.default.imageExists(imageName)) {
            cli_helper_1.default.info("Reusing docker image");
        }
        else {
            cli_helper_1.default.info("Building docker image");
            await docker_helper_1.default.imageBuild(imageName, argv.release, argv.dockerPath);
        }
        cli_helper_1.default.banner("Push step");
        cli_helper_1.default.info("Setting up AWS Docker Auth...");
        const ecrCredentials = await (0, aws_helper_1.ecrGetDockerCredentials)({
            region: argv.awsRegion,
        });
        try {
            await docker_helper_1.default.login(ecrCredentials.endpoint, "AWS", ecrCredentials.password);
            cli_helper_1.default.info("AWS ECR Docker Login succeeded");
            if (!argv.ci) {
                if (!(await cli_helper_1.default.confirm("Press enter to upload image to ECR..."))) {
                    cli_helper_1.default.info("Canceled");
                    return;
                }
            }
            await docker_helper_1.default.imagePush(imageName);
            cli_helper_1.default.info(`Done! Deploy the service with yarn ecs:deploy --stage ${argv.stage}`);
        }
        catch (e) {
            throw e;
        }
        finally {
            await docker_helper_1.default.logout(ecrCredentials.endpoint);
        }
    },
};
