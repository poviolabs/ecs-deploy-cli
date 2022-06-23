"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Docker = void 0;
const child_process_1 = require("child_process");
class Docker {
    constructor(options = {}) {
        this.cwd = options.cwd || process.cwd();
        this.env = options.env || {};
        this.verbose = !!options.verbose;
    }
    async version(options) {
        return this.handleResponse("version --format '{{json .}}'", options, (response) => {
            const data = JSON.parse(response.raw);
            return `Client ${data.Client.Version} Server ${data.Server.Version}`;
        });
    }
    async login(data, options) {
        return this.handleResponse(`login --username ${data.username} --password-stdin ${data.serveraddress}`, { ...options, stdin: data.password }, (response) => {
            if (/Login Succeeded/.test(response.raw))
                return true;
            throw new Error("Invalid response while logging in");
        });
    }
    async logout(data, options) {
        return this.handleResponse(`logout  ${data.serveraddress}`, options, (response) => {
            return;
        });
    }
    async imagePull(imageName, options) {
        return this.handleResponse(`pull ${imageName}`, options, (response) => {
            return undefined;
        });
    }
    async imageExists(imageName, options) {
        return this.handleResponse(`image inspect ${imageName} --format="found"`, options, (response) => {
            return /found/.test(response.raw);
        }, (e) => {
            if (/No such image/.test(e.message)) {
                return false;
            }
            throw e;
        });
    }
    async imageBuild(buildOptions, options) {
        if (buildOptions.buildx) {
            await this.execute("buildx install");
            await this.execute("buildx create --name ecs-build --use");
        }
        try {
            let command = buildOptions.buildx ? "buildx build " : "build ";
            command += `--progress plain `;
            command += `-t "${buildOptions.imageName}" `;
            if (buildOptions.platform) {
                command += `--platform ${buildOptions.platform} `;
            }
            for (const s of buildOptions.src) {
                command += `-f ${s} `;
            }
            for (const [k, v] of Object.entries(buildOptions.buildargs || {})) {
                command += `--build-arg ${k}="${v}" `;
            }
            if (buildOptions.noCache) {
                command += "--no-cache ";
            }
            if (buildOptions.previousImageName) {
                command += `--cache-from ${buildOptions.previousImageName} "`;
            }
            command += buildOptions.context ?? process.cwd();
            if (buildOptions.push) {
                command += " --push";
            }
            return this.handleResponse(command, options, (response) => {
                return undefined;
            });
        }
        catch (e) {
            throw e;
        }
        finally {
            if (buildOptions.buildx) {
                await this.execute("buildx rm ecs-build");
            }
        }
    }
    async imagePush(imageName, options) {
        return this.handleResponse(`push ${imageName}`, options, (response) => {
            return undefined;
        });
    }
    async handleResponse(execCommand, options = {}, parser, onError) {
        let response = { execCommand };
        try {
            // dry run and unit tests
            if (options.dryRun || options.mockResponse) {
                return {
                    execCommand,
                    raw: options.mockResponse,
                    data: options.mockResponse && !options.dryRun
                        ? parser({ execCommand, raw: options.mockResponse })
                        : undefined,
                };
            }
            // execute docker command and parse response
            response = await this.execute(execCommand, options);
            return {
                ...response,
                data: parser(response),
            };
        }
        catch (e) {
            e.response = response;
            if (onError) {
                return {
                    ...response,
                    error: e,
                    data: onError(e),
                };
            }
            throw e;
        }
    }
    async execute(execCommand, options = {}) {
        const execOptions = {
            cwd: this.cwd,
            env: {
                DEBUG: "",
                HOME: process.env.HOME,
                PATH: process.env.PATH,
                ...(this.env ? this.env : {}),
            },
            maxBuffer: 200 * 1024 * 1024,
        };
        const raw = await new Promise((resolve, reject) => {
            if (this.verbose) {
                console.log(`[DOCKER] docker ${execCommand}`);
            }
            const childProcess = (0, child_process_1.exec)(`docker ${execCommand}`, execOptions, (error, stdout, stderr) => {
                if (error) {
                    return reject(Object.assign(new Error(`Error: stdout ${stdout}, stderr ${stderr}`), { ...error, stdout, stderr, innerError: error }));
                }
                resolve(stdout);
            });
            if (!childProcess ||
                !childProcess.stdin ||
                !childProcess.stdout ||
                !childProcess.stderr) {
                throw new Error("Could not set up docker command");
            }
            if (options.stdin) {
                childProcess.stdin.write(options.stdin);
                childProcess.stdin.end();
            }
            if (this.verbose || options.verbose) {
                childProcess.stdout.on("data", (chunk) => {
                    process.stdout.write(chunk.toString());
                });
                childProcess.stderr.on("data", (chunk) => {
                    process.stderr.write(chunk.toString());
                });
            }
        });
        return {
            raw,
            data: undefined,
            execCommand: execCommand,
            execOptions: execOptions,
        };
    }
}
exports.Docker = Docker;
//# sourceMappingURL=docker.helper.js.map