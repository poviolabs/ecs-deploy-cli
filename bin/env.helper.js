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
exports.getEnv = void 0;
const dotenv = __importStar(require("dotenv"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const cli_helper_1 = __importDefault(require("./cli.helper"));
/**
 * Get env from .env.${STAGE}(?:.(${SERVICE}|secrets))
 * @param pwd
 * @param stage
 * @param override - Override the current process.env
 */
function getEnv(pwd, stage, override = true) {
    let out = {};
    if (!pwd) {
        throw new Error("Path not set");
    }
    if (stage) {
        if (fs.existsSync(path.join(pwd, `.env.${stage}`))) {
            // cli.info(`Loading .env.${stage}`);
            out = {
                ...out,
                ...dotenv.parse(fs.readFileSync(path.join(pwd, `.env.${stage}`))),
            };
        }
        else {
            cli_helper_1.default.notice(`Can not find .env.${stage}`);
        }
        // load deploy time secrets
        // runtime secrets should be injected with SSM/Secrets, see load_secrets
        if (fs.existsSync(`.env.${stage}.secrets`)) {
            if (process.env.CI) {
                cli_helper_1.default.warning(`Loading .env.${stage}.secrets`);
            }
            else {
                cli_helper_1.default.info(`Loading .env.${stage}.secrets`);
            }
            out = {
                ...out,
                ...dotenv.parse(fs.readFileSync(path.join(pwd, `.env.${stage}.secrets`))),
            };
        }
        //  load in a target of the stage
        //  example use is for deploying multiple tasks
        if (process.env.SERVICE) {
            const service = process.env.SERVICE;
            if (fs.existsSync(`.env.${stage}.${service}`)) {
                cli_helper_1.default.info(`Loading .env.${stage}.${service}`);
                out = {
                    ...out,
                    ...dotenv.parse(fs.readFileSync(path.join(pwd, `.env.${stage}.${service}`))),
                };
            }
            else {
                cli_helper_1.default.notice(`Can not find .env.${stage}.${service}`);
            }
        }
    }
    for (const [k, v] of Object.entries(process.env)) {
        if (k in out && out[k] !== v) {
            out[k] = process.env[k];
        }
    }
    if (out["STAGE"] && out["STAGE"] !== stage) {
        throw new Error("Stage was overwritten in config file");
    }
    if (out["PWD"] && out["PWD"] !== pwd) {
        throw new Error("Path was overwritten in config file");
    }
    if (override) {
        for (const [k, v] of Object.entries(out)) {
            if (!(k in process.env)) {
                process.env[k] = v;
            }
        }
    }
    return out;
}
exports.getEnv = getEnv;
