"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRelease = exports.getGitChanges = exports.getGitVersion = void 0;
const simple_git_1 = __importDefault(require("simple-git"));
async function getGitVersion(pwd) {
    try {
        const git = (0, simple_git_1.default)(pwd);
        return (await git.raw("--version")).trim();
    }
    catch (e) {
        return undefined;
    }
}
exports.getGitVersion = getGitVersion;
async function getGitChanges(pwd) {
    try {
        const git = (0, simple_git_1.default)(pwd);
        return git.raw("status", "--porcelain");
    }
    catch (e) {
        console.log(e);
        return undefined;
    }
}
exports.getGitChanges = getGitChanges;
async function getRelease(pwd) {
    try {
        const git = (0, simple_git_1.default)(pwd);
        return await git.revparse("HEAD");
    }
    catch (e) {
        console.log(e);
        return undefined;
    }
}
exports.getRelease = getRelease;
