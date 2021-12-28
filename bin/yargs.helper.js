"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Options = exports.getYargsOptions = exports.getOptions = exports.Option = void 0;
require("reflect-metadata");
const env_helper_1 = require("./env.helper");
const optionsKey = Symbol("options_key");
function Option(properties) {
    return (target, propertyKey) => {
        if (properties !== undefined && properties !== null) {
            const newMetadata = {
                ...(Reflect.getMetadata(optionsKey, target) || {}),
                [propertyKey]: {
                    ...properties,
                    describe: properties.envAlias
                        ? `${properties.describe || ""} [${properties.envAlias}]`
                        : properties.describe,
                    type: properties.type ||
                        Reflect.getMetadata("design:type", target, propertyKey).name.toLowerCase(),
                },
            };
            Reflect.defineMetadata(optionsKey, newMetadata, target);
        }
    };
}
exports.Option = Option;
function getOptions(target) {
    const options = Reflect.getMetadata(optionsKey, target.prototype);
    if (!options) {
        throw new Error(`Options for ${target.name} were not defined`);
    }
    return options;
}
exports.getOptions = getOptions;
function getYargsOptions(target) {
    return Object.entries(getOptions(target)).reduce((a, [property, options]) => {
        a[property] = Object.fromEntries(Object.entries(options).filter(([optionName, optionValue]) => !["envAlias", "default"].includes(optionName)));
        return a;
    }, {});
}
exports.getYargsOptions = getYargsOptions;
class Options {
    constructor(values, overrideEnv) {
        this.stage = values.stage || process.env.STAGE;
        this.pwd = values.pwd || process.cwd();
        const environment = (0, env_helper_1.getEnv)(this.pwd, this.stage, overrideEnv);
        // override from ENV
        for (const [name, o] of Object.entries(getOptions(this.constructor))) {
            if (["pwd", "stage"].includes(name)) {
                continue;
            }
            this[name] = values[name];
            // fallback to env
            if (o.envAlias) {
                if (this[name] === undefined) {
                    // get option from ENV
                    if (environment[o.envAlias] !== undefined) {
                        this[name] = environment[o.envAlias];
                    }
                }
                else {
                    // write option from yargs back into ENV
                    if (overrideEnv) {
                        process.env[o.envAlias] = this[name];
                    }
                }
            }
            // fallback to default
            if (this[name] === undefined && o.default) {
                // use default from yargs
                this[name] = o.default;
            }
        }
    }
}
exports.Options = Options;
