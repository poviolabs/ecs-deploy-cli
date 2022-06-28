"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ecsWatch = exports.ecsUpdateService = exports.ecsRegisterTaskDefinition = exports.ecsGetCurrentTaskDefinition = exports.ecrGetDockerCredentials = exports.ecrGetLatestImageTag = exports.ecrImageExists = exports.getAwsIdentity = void 0;
const client_ecs_1 = require("@aws-sdk/client-ecs");
const client_ecr_1 = require("@aws-sdk/client-ecr");
const credential_provider_ini_1 = require("@aws-sdk/credential-provider-ini");
const credential_provider_env_1 = require("@aws-sdk/credential-provider-env");
const client_sts_1 = require("@aws-sdk/client-sts");
const node_stage_1 = require("node-stage");
function getCredentials() {
    if (process.env.AWS_PROFILE) {
        return (0, credential_provider_ini_1.fromIni)();
    }
    return (0, credential_provider_env_1.fromEnv)();
}
async function getAwsIdentity(options) {
    const stsClient = new client_sts_1.STSClient({
        credentials: getCredentials(),
        region: options.region,
    });
    return await stsClient.send(new client_sts_1.GetCallerIdentityCommand({}));
}
exports.getAwsIdentity = getAwsIdentity;
function getEcrInstance(options) {
    return new client_ecr_1.ECRClient({
        credentials: getCredentials(),
        region: options.region,
    });
}
async function ecrImageExists(options) {
    const ecr = getEcrInstance({ region: options.region });
    try {
        const images = await ecr.send(new client_ecr_1.DescribeImagesCommand({
            repositoryName: options.repositoryName,
            imageIds: options.imageIds,
        }));
        if (process.env.VERBOSE) {
            (0, node_stage_1.logVerbose)(JSON.stringify(images.imageDetails));
        }
    }
    catch (e) {
        if (e?.name === "ImageNotFoundException") {
            return false;
        }
        throw e;
    }
    return true;
}
exports.ecrImageExists = ecrImageExists;
async function ecrGetLatestImageTag(options) {
    const ecr = getEcrInstance({ region: options.region });
    try {
        const images = (await ecr.send(new client_ecr_1.DescribeImagesCommand({
            repositoryName: options.repositoryName,
        }))).imageDetails;
        images.sort((a, b) => {
            if (!b.imagePushedAt || !a.imagePushedAt)
                return 0;
            return (b.imagePushedAt || 0) < (a.imagePushedAt || 0) ? -1 : 1;
        });
        return images[0].imageTags?.[0];
    }
    catch (e) {
        if (e.name === "ImageNotFoundException") {
            return false;
        }
        throw e;
    }
}
exports.ecrGetLatestImageTag = ecrGetLatestImageTag;
async function ecrGetDockerCredentials(options) {
    const ecr = getEcrInstance({ region: options.region });
    const auth = await ecr.send(new client_ecr_1.GetAuthorizationTokenCommand({}));
    const authorizationToken = auth?.authorizationData?.[0].authorizationToken;
    const proxyEndpoint = auth?.authorizationData?.[0].proxyEndpoint;
    if (!authorizationToken || !proxyEndpoint) {
        throw new Error("Could not get auth token or proxy");
    }
    let password;
    try {
        password = Buffer.from(authorizationToken, "base64")
            .toString("ascii")
            .split(":")[1];
    }
    catch (e) {
        throw new Error("Could not decode authorizationData");
    }
    return {
        password,
        username: "AWS",
        endpoint: proxyEndpoint,
    };
}
exports.ecrGetDockerCredentials = ecrGetDockerCredentials;
function getECSInstance(options) {
    return new client_ecs_1.ECSClient({
        credentials: getCredentials(),
        region: options.region,
    });
}
async function ecsGetCurrentTaskDefinition(options) {
    const ecs = getECSInstance({ region: options.region });
    const taskDefinition = (await ecs.send(new client_ecs_1.DescribeTaskDefinitionCommand({
        taskDefinition: options.taskDefinition,
    }))).taskDefinition;
    if (process.env.VERBOSE) {
        (0, node_stage_1.logVerbose)(JSON.stringify(taskDefinition));
    }
    return taskDefinition;
}
exports.ecsGetCurrentTaskDefinition = ecsGetCurrentTaskDefinition;
async function ecsRegisterTaskDefinition(options) {
    const ecs = getECSInstance({ region: options.region });
    const taskDefinition = (await ecs.send(new client_ecs_1.RegisterTaskDefinitionCommand(options.taskDefinitionRequest))).taskDefinition;
    if (process.env.VERBOSE) {
        (0, node_stage_1.logVerbose)(JSON.stringify(taskDefinition));
    }
    return taskDefinition;
}
exports.ecsRegisterTaskDefinition = ecsRegisterTaskDefinition;
async function ecsUpdateService(options) {
    const ecs = getECSInstance({ region: options.region });
    const service = (await ecs.send(new client_ecs_1.UpdateServiceCommand({
        cluster: options.cluster,
        service: options.service,
        taskDefinition: options.taskDefinition,
    }))).service;
    if (process.env.VERBOSE) {
        (0, node_stage_1.logVerbose)(JSON.stringify(service));
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
    let lastEventDate = undefined;
    // todo, events might be lost here, make a lastEventDate per source
    let resolve;
    let reject;
    const getService = async () => {
        try {
            let passLastEventDate = undefined;
            const services = await ecs.send(new client_ecs_1.DescribeServicesCommand({
                services: [options.service],
                cluster: options.cluster,
            }));
            if (!services.services) {
                throw new Error("Expected services but got none");
            }
            callback({ type: "services", services: services.services });
            services.services.forEach((s) => {
                if (s.deployments) {
                    s.deployments.forEach((d) => {
                        if ((d.updatedAt || 0) > (lastEventDate || 0)) {
                            callback({ type: "deployment", deployment: d });
                            if (d.updatedAt &&
                                (!passLastEventDate || passLastEventDate < d.updatedAt)) {
                                passLastEventDate = d.updatedAt;
                            }
                        }
                    });
                }
                if (s.events && s.events.length > 0) {
                    let events;
                    // sort event, the oldest is first
                    events = s.events.sort((x, y) => (x.createdAt || 0) > (y.createdAt || 0) ? 1 : -1);
                    if (lastEventDate) {
                        events = s.events.filter((x) => (x.createdAt || 0) > (lastEventDate || 0));
                    }
                    else {
                        // show last n events
                        events = showOlder ? events.slice(-showOlder) : [];
                    }
                    events.forEach((x) => {
                        if (x.createdAt &&
                            (!passLastEventDate || passLastEventDate < x.createdAt)) {
                            passLastEventDate = x.createdAt;
                        }
                        callback({
                            type: "message",
                            message: x.message || "",
                            createdAt: x.createdAt || new Date(),
                            source: s.serviceName,
                        });
                    });
                }
            });
            if (!lastEventDate ||
                (passLastEventDate || new Date(0)) > lastEventDate) {
                lastEventDate = passLastEventDate;
            }
        }
        catch (e) {
            stop();
            reject(e);
        }
    };
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
//# sourceMappingURL=aws.helper.js.map