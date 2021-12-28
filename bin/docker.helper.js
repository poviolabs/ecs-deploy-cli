"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.login = exports.imagePush = exports.imageBuild = exports.imageExists = exports.version = void 0;
const docker_cli_js_1 = require("docker-cli-js");
const cli_helper_1 = __importDefault(require("./cli.helper"));
const options = {
    echo: false,
};
async function version() {
    try {
        return (await (0, docker_cli_js_1.dockerCommand)("--version", options)).raw
            .replace(/"|\\n/, "")
            .trim();
    }
    catch (e) {
        if (process.env.VERBOSE) {
            cli_helper_1.default.verbose(e.toString());
        }
        return undefined;
    }
}
exports.version = version;
async function imageExists(imageName) {
    const images = await (0, docker_cli_js_1.dockerCommand)(`images ${imageName}`, { echo: false });
    if (process.env.VERBOSE) {
        cli_helper_1.default.verbose(JSON.stringify(images));
    }
    return "images" in images && images.images.length > 0;
}
exports.imageExists = imageExists;
async function imageBuild(imageName, release, dockerFile) {
    await (0, docker_cli_js_1.dockerCommand)(`build --progress plain -t "${imageName}" -f "${dockerFile}" . --build-arg RELEASE="${release}"`, { echo: true });
}
exports.imageBuild = imageBuild;
async function imagePush(imageName) {
    await (0, docker_cli_js_1.dockerCommand)(`push ${imageName}`, { echo: true });
}
exports.imagePush = imagePush;
async function login(server, username, password) {
    const response = await (0, docker_cli_js_1.dockerCommand)(`-l "debug" login --username ${username} --password ${password} ${server}`, { echo: false });
    if (process.env.VERBOSE) {
        cli_helper_1.default.verbose(JSON.stringify(response));
    }
    return response.login && response.login === "Login Succeeded";
}
exports.login = login;
async function logout(server) {
    await (0, docker_cli_js_1.dockerCommand)(`logout ${server}`, { echo: false });
}
exports.logout = logout;
exports.default = {
    version,
    logout,
    login,
    imageBuild,
    imageExists,
    imagePush,
};
