/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import {spawnSync} from "child_process";
import {DefaultLogger as log} from "./logger";
import JUnitStrategy from "./strategies/junit";
import NaiveStrategy from "./strategies/naive";

interface Strategy {
  listFilterFunc(line: string, testIndex: number): boolean
}

export type ListerOptions = {
  total: number;
  index: number;
  packages: string;
  list: string;
  flags: string;
  whichGo: string;
  junitSummary?: string;
  workingDirectory: string;
  env?: NodeJS.ProcessEnv;
};

export class GoTestLister {
  opts: ListerOptions;

  constructor(opts: ListerOptions) {
    this.opts = opts;
  }

  private formatTests(tests: string[]): string {
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

  private async listTests(): Promise<string[]> {
    let g = this.opts.whichGo;
    const args = [
      "test",
      this.opts.packages,
      "-list",
      this.opts.list,
      this.opts.flags,
    ];

    log.info(
      `Listing go tests with the following command: ${g} ${args.join(" ")}`
    );
    const cmd = spawnSync(g, args, {
      cwd: this.opts.workingDirectory,
      encoding: "utf-8",
      env: {...process.env, ...this.opts.env},
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

  public async outputTestListForRunArg(): Promise<string> {
    let strategy: Strategy = new NaiveStrategy(this.opts.total, this.opts.index)
    const allTests = await this.listTests();

    if(this.opts.junitSummary) {
      strategy = new JUnitStrategy(this.opts.total, this.opts.index, this.opts.junitSummary, allTests)
    }

    const testsForIndex = allTests.filter(strategy.listFilterFunc.bind(strategy));

    log.debug(
      `Output populated with these specific tests:\n${testsForIndex.join("\n")}`
    );

    return this.formatTests(testsForIndex);
  }
}
