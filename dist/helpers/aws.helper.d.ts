import { RegisterTaskDefinitionCommandInput, Service, Deployment } from "@aws-sdk/client-ecs";
import { ImageIdentifier } from "@aws-sdk/client-ecr";
export declare function getAwsIdentity(options: {
    region: string;
}): Promise<import("@aws-sdk/client-sts").GetCallerIdentityCommandOutput>;
export declare function ecrImageExists(options: {
    region: string;
    repositoryName: string;
    imageIds: ImageIdentifier[];
}): Promise<boolean>;
export declare function ecrGetLatestImageTag(options: {
    region: string;
    repositoryName: string;
}): Promise<string | false | undefined>;
export declare function ecrGetDockerCredentials(options: {
    region: string;
}): Promise<{
    password: string;
    username: string;
    endpoint: string | undefined;
}>;
export declare function ecsGetCurrentTaskDefinition(options: {
    taskDefinition: string;
    region: string;
}): Promise<import("@aws-sdk/client-ecs").TaskDefinition | undefined>;
export declare function ecsRegisterTaskDefinition(options: {
    region: string;
    taskDefinitionRequest: RegisterTaskDefinitionCommandInput;
}): Promise<import("@aws-sdk/client-ecs").TaskDefinition | undefined>;
export declare function ecsUpdateService(options: {
    region: string;
    cluster: string;
    service: string;
    taskDefinition: string;
}): Promise<Service | undefined>;
/**
 * Periodically check ECS Service and Cluster for new messages
 * @param options
 * @param callback
 */
export declare function ecsWatch(options: {
    region: string;
    cluster: string;
    service: string;
    delay?: number;
    showOlder?: number;
}, callback: (message: {
    type: "message";
    source?: string;
    message: string;
    createdAt: Date;
} | {
    type: "services";
    services: Service[];
} | {
    type: "deployment";
    deployment: Deployment;
}) => void): {
    stop: () => void;
    promise: Promise<void>;
};
