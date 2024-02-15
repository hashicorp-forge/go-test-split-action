/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as core from "@actions/core";
import * as io from "@actions/io";
import * as fs from 'fs';

import {GoTestLister, ListerOptions} from "./go-test-lister";

export function configure(
  whichGo: string,
  env?: NodeJS.ProcessEnv
): GoTestLister {
  let opts: ListerOptions = {
    // The go binary-- in GHA, this should be the result of await io.which("go")
    whichGo,

    // Slice input params
    total: Number.parseInt(core.getInput("total")),
    index: Number.parseInt(core.getInput("index")),

    // Go test input params
    packages: core.getInput("packages") || "./...",
    list: core.getInput("list") || ".",
    flags: core.getInput("flags"),

    // JUnit option
    junitSummary: core.getInput("junit-summary"),

    // Env
    workingDirectory: process.env.GITHUB_WORKSPACE,
    env,
  };

  // Input validation
  if (Number.isNaN(opts.total) || Number.isNaN(opts.index)) {
    throw new Error(
      `Unexpected input: index "${core.getInput("index")}" of "${core.getInput(
        "total"
      )}" total`
    );
  }

  if (opts.index > opts.total - 1 || opts.index < 0) {
    throw new Error(
      `Slice index out of range: Requested index ${opts.index} of ${opts.total} total slices`
    );
  }

  return new GoTestLister(opts);
}

(async () => {
  try {
    const lister = configure(await io.which("go"));
    const privateRepoPassword = core.getInput('private_repo_password');
    if (privateRepoPassword) {
      fs.writeFileSync(process.env.HOME + '/.netrc', `machine github.com login git password ${privateRepoPassword}`);
    }    
    await core.group("Generate go test Slice", async () => {
      core.setOutput("run", await lister.outputTestListForRunArg());
    });
  } catch (error) {
    core.setFailed(error.message);
  }
})();
