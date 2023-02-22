/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as fs from "fs";
import {XMLParser} from "fast-xml-parser";
import {DefaultLogger as log} from "../logger";

type TestList = {
  list: Set<string>;
  caseTimeTotal: number;
};

type TestTiming = {
  name: string;
  timing: number;
};

// JUnitStrategy filters tests to a slice index informed by the timing in a junit test
// summary XML file. The filter is only guaranteed to work if used on a list that is
// identical to the one specified by the allTestNames parameter.
export default class JUnitStrategy {
  // Constructor params
  private total: number;
  private index: number;
  private junitSummaryPath: string;
  private allTestNames: string[];

  // The precomputed lists of tests, containing _total_ items
  private lists: TestList[];

  constructor(
    total: number,
    index: number,
    junitSummaryPath: string,
    allTestNames: string[]
  ) {
    this.total = total;
    this.index = index;
    this.allTestNames = allTestNames;
    this.junitSummaryPath = junitSummaryPath;
  }

  // A heap would make this operation faster, but we expect very small _total_ slices,
  // since these represent workflow runners.
  private chooseBestList(): number {
    let best = 0;
    let bestTiming = Number.MAX_VALUE;
    for (let i = 0; i < this.lists.length; i++) {
      if (this.lists[i].caseTimeTotal < bestTiming) {
        best = i;
        bestTiming = this.lists[i].caseTimeTotal;
      }
    }
    return best;
  }

  private precomputeTestLists(): void {
    const data = fs.readFileSync(this.junitSummaryPath);
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@",
    });
    const junitData = parser.parse(data, true);

    if (!junitData?.testsuites?.testsuite) {
      throw new Error(
        "junit-summary is invalid. Expected testsuites/testsuite elements"
      );
    }

    // The data structure that comes out of XMLParser can take many forms, depending on the
    // number of child elements in each object. This enforces each child into an array and flattens
    // out all the testcase entities. See `/test-fixtures/junit` for examples.
    const cases = [junitData?.testsuites?.testsuite]
      .flat()
      .flatMap((suite: any) =>
        suite.testcase ? [suite.testcase].flat().flatMap((tc: any) => tc) : []
      );

    let casesByName: {[key: string]: any} = {};
    cases.forEach(c => {
      casesByName[c["@name"]] = c;
    });

    let timingsFound = 0;

    // An ordered list of tests that include timings, ordered by their duration
    let totalTiming = 0;
    const timings: TestTiming[] = this.allTestNames.map((name, index) => {
      let testcase = casesByName[name];

      if (testcase) {
        const timing = Number.parseFloat(testcase["@time"]);
        totalTiming += timing;
        timingsFound += 1;

        return {
          name: testcase["@name"],
          timing: timing,
        };
      }

      const averageTiming = index > 0 ? totalTiming / (index + 1) : 1.0;
      log.debug(
        `Could not find timing data for ${name}, substituting default value of ${averageTiming}s (the average so far)`
      );

      return {
        name,
        timing: averageTiming,
      };
    });

    // Sort all the found timings in reverse order (longest time first)
    timings.sort((a, b) => b.timing - a.timing);

    if (this.allTestNames.length > 0) {
      log.info(
        `Found ${timingsFound} testcase timings, which is ${(
          (timingsFound / this.allTestNames.length) *
          100
        ).toFixed(1)}% of all tests`
      );
    } else {
      log.warning("No tests were specified");
    }

    // Initialize a list of lists with exactly _total_ items
    this.lists = [];
    for (let i = 0; i < this.total; i++) {
      this.lists.push({list: new Set(), caseTimeTotal: 0.0});
    }

    // Add each test to the list that has the smallest total timing sum. Add the new timing
    // (or a placeholder value of the median time for new tests) to the running total of that list.
    timings.forEach(testWithTiming => {
      const bestIndex = this.chooseBestList();
      const bestList = this.lists[bestIndex];

      bestList.list.add(testWithTiming.name);
      bestList.caseTimeTotal += testWithTiming.timing;

      log.debug(
        `Assigning ${
          testWithTiming.name
        } to list ${bestIndex}, which now has a ${
          bestList.caseTimeTotal
        } estimated runtime (previously ${
          bestList.caseTimeTotal - testWithTiming.timing
        })`
      );
    });
  }

  public estimatedDuration(): number {
    if (this.lists === undefined) {
      this.precomputeTestLists();
    }

    return this.lists[this.index].caseTimeTotal;
  }

  public listFilterFunc(line: string): boolean {
    if (this.lists === undefined) {
      this.precomputeTestLists();
    }

    // Return true if the list at _index_ contains the test name
    return this.lists[this.index].list.has(line);
  }
}
