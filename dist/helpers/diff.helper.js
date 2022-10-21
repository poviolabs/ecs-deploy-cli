"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printDiff = void 0;
const diff_1 = require("diff");
const chalk_1 = require("@povio/node-stage/chalk");
function printDiff(one, two) {
    for (const { value, added, removed } of (0, diff_1.diffJson)(one, two)) {
        if (added) {
            console.log(chalk_1.chk.yellow(value.replace(/\n$/, "")));
        }
        else if (removed) {
            console.log(chalk_1.chk.green(value.replace(/\n$/, "")));
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
    printDiff,
};
//# sourceMappingURL=diff.helper.js.map