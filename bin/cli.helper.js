"use strict";
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printDiff = exports.printEnvironment = exports.confirm = exports.promptVar = exports.banner = exports.error = exports.warning = exports.success = exports.notice = exports.verbose = exports.info = exports.variable = exports.nonInteractive = exports.chk = void 0;
const chalk_1 = __importDefault(require("chalk"));
const Console = __importStar(require("console"));
const prompt_sync_1 = __importDefault(require("prompt-sync"));
const process_1 = __importDefault(require("process"));
const git_helper_1 = require("./git.helper");
const index_1 = require("./index");
const diff_1 = require("diff");
exports.chk = new chalk_1.default.Instance({ level: 2 });
const log = Console.log;
const prompt = (0, prompt_sync_1.default)({ sigint: true });
exports.nonInteractive = !!process_1.default.env.CI;
/**
 * Print a variable, color it magenta if it's different from the default
 * @param name
 * @param value
 * @param defaultValue
 */
function variable(name, value, defaultValue) {
    if (defaultValue !== undefined && defaultValue !== value) {
        log(`${exports.chk.yellow(`${name}:`.padEnd(20))}${exports.chk.magenta(value)}`);
    }
    else {
        log(`${`${name}:`.padEnd(20)}${value}`);
    }
}
exports.variable = variable;
function info(message) {
    log(`[INFO] ${message}`);
}
exports.info = info;
function verbose(message) {
    log(`[VERBOSE] ${message}`);
}
exports.verbose = verbose;
function notice(message) {
    log(exports.chk.magenta(`[NOTICE] ${message}`));
}
exports.notice = notice;
function success(message) {
    log(exports.chk.green(`[SUCCESS] ${message}`));
}
exports.success = success;
function warning(message) {
    log(exports.chk.red(`[WARNING] ${message}`));
}
exports.warning = warning;
function error(message) {
    log(exports.chk.red(`[ERROR] ${message}`));
}
exports.error = error;
function banner(message) {
    log(exports.chk.bgYellow(`==== ${message} ====`));
}
exports.banner = banner;
/**
 * Set a env variable
 * @param name
 * @param value
 * @param suggested - the value the scripts expects and suggest
 */
function promptVar(name, value, suggested) {
    if (value !== undefined) {
        variable(name, value, suggested);
        return value;
    }
    if (exports.nonInteractive) {
        if (suggested !== undefined) {
            // take suggestion on CI
            variable(name, value, suggested);
            return suggested;
        }
        else {
            throw new Error(`Missing Environment: ${name}`);
        }
    }
    else {
        const response = prompt(`Please provide ${exports.chk.yellow(name)} (${suggested}):`, suggested);
        // todo remove previous line to prevent duplicates
        variable(name, response, suggested);
        return response;
    }
}
exports.promptVar = promptVar;
async function confirm(message) {
    return (await prompt(message, "yes")) === "yes";
}
exports.confirm = confirm;
async function printEnvironment(argv) {
    banner(`ECS Build ${index_1.ECS_DEPLOY_CLI}`);
    variable("PWD", argv.pwd);
    variable("NODE_VERSION", process_1.default.version);
    variable("GIT_CLI_VERSION", await (0, git_helper_1.getGitVersion)(argv.pwd));
    if (argv.stage) {
        // get current STAGE if set
        // CI would not use this for builds
        variable("STAGE", argv.stage);
    }
}
exports.printEnvironment = printEnvironment;
function printDiff(one, two) {
    const line = 0;
    for (const { value, added, removed } of (0, diff_1.diffJson)(one, two)) {
        if (added) {
            console.log(exports.chk.yellow(value.replace(/\n$/, "")));
        }
        else if (removed) {
            console.log(exports.chk.green(value.replace(/\n$/, "")));
        }
        else {
            const text = value.replace(/\n$/, "").split("\n");
            if (text.length < 6) {
                console.log(value.replace(/\n$/, ""));
            }
            else {
                console.log([
                    text[0],
                    text[1],
                    "...",
                    text[text.length - 2],
                    text[text.length - 1],
                ].join("\n"));
            }
        }
    }
}
exports.printDiff = printDiff;
exports.default = {
    printEnvironment,
    confirm,
    promptVar,
    variable,
    notice,
    warning,
    error,
    banner,
    info,
    verbose,
    printDiff,
    success,
};
