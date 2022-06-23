interface CommandOptions {
    verbose?: boolean;
    stdin?: string;
    dryRun?: boolean;
    mockResponse?: string;
}
interface CommandResponse<T> {
    raw?: string;
    data?: T;
    execCommand: string;
    execOptions?: any;
    error?: any;
}
export declare class Docker {
    private cwd;
    private verbose;
    private env;
    constructor(options?: {
        cwd?: string;
        env?: Record<string, string>;
        verbose?: boolean;
    });
    version(options?: CommandOptions): Promise<CommandResponse<string>>;
    login(data: {
        serveraddress?: string;
        username: string;
        password: string;
    }, options?: CommandOptions): Promise<CommandResponse<boolean>>;
    logout(data: {
        serveraddress?: string;
    }, options?: CommandOptions): Promise<CommandResponse<void>>;
    imagePull(imageName: string, options?: CommandOptions): Promise<CommandResponse<undefined>>;
    imageExists(imageName: string, options?: CommandOptions): Promise<CommandResponse<boolean>>;
    imageBuild(buildOptions: {
        context: string;
        src: string[];
        imageName: string;
        previousImageName?: string;
        buildargs?: {
            [key: string]: string;
        };
        noCache?: boolean;
        buildx?: boolean;
        platform?: string;
        push: boolean;
    }, options?: CommandOptions): Promise<CommandResponse<undefined>>;
    imagePush(imageName: string, options?: CommandOptions): Promise<CommandResponse<undefined>>;
    private handleResponse;
    private execute;
}
export {};
