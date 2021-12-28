"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ecsWatch = exports.ecsUpdateService = exports.ecsRegisterTaskDefinition = exports.ecsGetCurrentTaskDefinition = exports.ecrGetDockerCredentials = exports.ecrImageExists = void 0;
const aws_sdk_1 = require("aws-sdk");
const cli_helper_1 = __importDefault(require("./cli.helper"));
function getCredentials() {
    if (!!process.env.AWS_PROFILE) {
        return new aws_sdk_1.SharedIniFileCredentials({
            profile: process.env.AWS_PROFILE,
        });
    }
    else {
        return new aws_sdk_1.Credentials({
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            sessionToken: process.env.AWS_SESSION_TOKEN || undefined,
        });
    }
}
function getEcrInstance(options) {
    return new aws_sdk_1.ECR({
        credentials: getCredentials(),
        region: options.region,
    });
}
async function ecrImageExists(options) {
    const ecr = getEcrInstance({ region: options.region });
    try {
        const images = await ecr
            .describeImages({
            repositoryName: options.repositoryName,
            imageIds: options.imageIds,
        })
            .promise();
        if (process.env.VERBOSE) {
            cli_helper_1.default.verbose(JSON.stringify(images.imageDetails));
        }
    }
    catch (e) {
        if (e.name === "ImageNotFoundException") {
            return false;
        }
        throw e;
    }
    return true;
}
exports.ecrImageExists = ecrImageExists;
async function ecrGetDockerCredentials(options) {
    const ecr = getEcrInstance({ region: options.region });
    const auth = (await ecr.getAuthorizationToken().promise())
        .authorizationData[0];
    let password;
    try {
        password = Buffer.from(auth.authorizationToken, "base64")
            .toString("ascii")
            .split(":")[1];
    }
    catch (e) {
        throw new Error("Could not decode authorizationData");
    }
    return {
        password,
        username: "AWS",
        endpoint: auth.proxyEndpoint,
    };
}
exports.ecrGetDockerCredentials = ecrGetDockerCredentials;
function getECSInstance(options) {
    return new aws_sdk_1.ECS({
        credentials: getCredentials(),
        region: options.region,
    });
}
async function ecsGetCurrentTaskDefinition(options) {
    const ecs = getECSInstance({ region: options.region });
    const taskDefinition = (await ecs
        .describeTaskDefinition({
        taskDefinition: options.taskDefinition,
    })
        .promise()).taskDefinition;
    if (process.env.VERBOSE) {
        cli_helper_1.default.verbose(JSON.stringify(taskDefinition));
    }
    return taskDefinition;
}
exports.ecsGetCurrentTaskDefinition = ecsGetCurrentTaskDefinition;
async function ecsRegisterTaskDefinition(options) {
    const ecs = getECSInstance({ region: options.region });
    const taskDefinition = (await ecs.registerTaskDefinition(options.taskDefinitionRequest).promise()).taskDefinition;
    if (process.env.VERBOSE) {
        cli_helper_1.default.verbose(JSON.stringify(taskDefinition));
    }
    return taskDefinition;
}
exports.ecsRegisterTaskDefinition = ecsRegisterTaskDefinition;
async function ecsUpdateService(options) {
    const ecs = getECSInstance({ region: options.region });
    const service = (await ecs
        .updateService({
        cluster: options.cluster,
        service: options.service,
        taskDefinition: options.taskDefinition,
    })
        .promise()).service;
    if (process.env.VERBOSE) {
        cli_helper_1.default.verbose(JSON.stringify(service));
    }
    return service;
}
exports.ecsUpdateService = ecsUpdateService;
/**
 * Periodically check ECS Service and Cluster for new messages
 * @param options
 * @param callback
 */
function ecsWatch(options, callback) {
    const ecs = getECSInstance({ region: options.region });
    const showOlder = options.showOlder === undefined ? 5 : options.showOlder;
    let lastEventDate;
    // todo, events might be lost here, make a lastEventDate per source
    const getService = async () => {
        try {
            let passLastEventDate;
            const services = await ecs
                .describeServices({
                services: [options.service],
                cluster: options.cluster,
            })
                .promise();
            callback({ type: "services", services: services.services });
            services.services.forEach((s) => {
                s.deployments.forEach((d) => {
                    if (d.updatedAt > lastEventDate) {
                        callback({ type: "deployment", deployment: d });
                        if (!passLastEventDate || passLastEventDate < d.updatedAt) {
                            passLastEventDate = d.updatedAt;
                        }
                    }
                });
                if (s.events.length > 0) {
                    let events;
                    // sort event, the oldest is first
                    events = s.events.sort((x, y) => x.createdAt > y.createdAt ? 1 : -1);
                    if (lastEventDate) {
                        events = s.events.filter((x) => x.createdAt > lastEventDate);
                    }
                    else {
                        // show last n events
                        events = showOlder ? events.slice(-showOlder) : [];
                    }
                    events.forEach((x) => {
                        if (!passLastEventDate || passLastEventDate < x.createdAt) {
                            passLastEventDate = x.createdAt;
                        }
                        callback({
                            type: "message",
                            message: x.message,
                            createdAt: x.createdAt,
                            source: s.serviceName,
                        });
                    });
                }
            });
            if (!lastEventDate || passLastEventDate > lastEventDate) {
                lastEventDate = passLastEventDate;
            }
        }
        catch (e) {
            stop();
            reject(e);
        }
    };
    let resolve, reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    const stop = () => {
        clearInterval(interval);
        resolve();
    };
    const interval = setInterval(getService, (options.delay || 15) * 1000);
    getService().then();
    return {
        stop,
        promise,
    };
}
exports.ecsWatch = ecsWatch;
