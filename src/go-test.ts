/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as core from "@actions/core";
import * as io from "@actions/io";

import {spawnSync} from "child_process";

function formatTests(tests: string[]): string {
  return (
    "^(?:" +
    tests.reduce((acc, test) => {
      if (acc.length == 0) {
        return test;
      }
      return acc + "|" + test;
    }, "") +
    ")$"
  );
}

export function setupGoTestLister(
  env?: NodeJS.ProcessEnv
): () => Promise<void> {
  const total = Number.parseInt(core.getInput("total"));
  const index = Number.parseInt(core.getInput("index"));

  if (Number.isNaN(total) || Number.isNaN(index)) {
    throw new Error(
      `Unexpected input: index "${core.getInput("index")}" of "${core.getInput(
        "total"
      )}" total`
    );
  }

  if (index > total - 1 || index < 0) {
    throw new Error(
      `Slice index out of range: Requested index ${index} of ${total} total slices`
    );
  }

  const lister = new TestLister(total, index, env || {});
  return lister.outputTestList.bind(lister);
}

class TestLister {
  env: NodeJS.ProcessEnv;
  total: number;
  index: number;

  constructor(total: number, index: number, env: NodeJS.ProcessEnv) {
    this.total = total;
    this.index = index;
    this.env = env;
  }

  async listTests(): Promise<string[]> {
    let g = await io.which("go");
    const args = [
      "test",
      core.getInput("packages") || "./...",
      "-list",
      core.getInput("list") || ".",
      core.getInput("flags"),
    ];

    core.debug(
      `Listing go tests with the following command: ${g} ${args.join(" ")}`
    );
    const cmd = spawnSync(g, args, {
      cwd: process.env.GITHUB_WORKSPACE,
      encoding: "utf-8",
      env: {...process.env, ...this.env},
    });

    if (cmd.error) {
      throw new Error(`Could not execute go process: ${cmd.error.message}`);
    }

    if (cmd.status != 0) {
      throw new Error(
        `go test failed (exit code ${cmd.status}) The error output was:\n\n${cmd.stderr}\n\n${cmd.stdout}`
      );
    }

    return cmd.stdout.split("\n");
  }

  async outputTestList(): Promise<void> {
    const tests = (await this.listTests()).filter(
      (line, testIndex) =>
        line.startsWith("Test") && testIndex % this.total === this.index
    );

    core.setOutput("run", formatTests(tests));
  }
}
