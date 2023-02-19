import * as fs from "fs"
import { XMLParser } from "fast-xml-parser"
import { DefaultLogger as log } from "../logger"

type TestList = {
  list: Set<string>
  caseTimeTotal: number
};

type TestTiming = {
  name: string
  timing: number
};

// JUnitStrategy filters tests to a node index informed by the timing in a junit test
// summary XML file. The filter is only guaranteed to work if used on a list that is
// identical to the one specified by the allTestNames parameter.
export default class JUnitStrategy {
  // Constructor params
  private total: number
  private index: number
  private junitSummaryPath: string
  private allTestNames: string[]

  // The precomputed lists of tests, containing _total_ items
  private lists: TestList[]

  constructor(total: number, index: number, junitSummaryPath: string, allTestNames: string[]) {
    this.total = total;
    this.index = index;
    this.allTestNames = allTestNames;
    this.junitSummaryPath = junitSummaryPath
  }

  // A heap would make this operation faster, but we expect very small _total_ nodes,
  // since these represent workflow runners.
  private chooseBestList(): number {
    let best = 0;
    let bestTiming = Number.MAX_VALUE;
    for(let i = 0; i < this.lists.length; i++) {
      if(this.lists[i].caseTimeTotal < bestTiming) {
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

    // An ordered list of tests that include timings, ordered by their duration
    const timings: TestTiming[] = []

    // A set of test names that include timings
    const testsWithTimings: Set<string> = new Set();

    const cases = Array.isArray(junitData?.testsuites?.testsuite) ?
      Array.from(junitData?.testsuites?.testsuite).flatMap((suite: any) => suite.testcase) :
      Array.from(junitData?.testsuites?.testsuite.testcase);

    // Convert this raw XML object structure to a map of test name -> timing and log which
    // tests actually have timings.
    cases.forEach((testcase: any) => {
      timings.push({ name: testcase["@name"], timing: Number.parseFloat(testcase["@time"]) });
      testsWithTimings.add(testcase["@name"]);
    });

    log.info(`Found ${timings.length} testcase timings, which is ${((timings.length / this.allTestNames.length) * 100).toFixed(1)}% of all tests`)

    // Sort all the found timings in reverse order (longtest time first)
    timings.sort((a, b) => b.timing - a.timing);

    // Initialize a list of lists with exactly _total_ items
    this.lists = [];
    for(let i = 0; i < this.total; i++) {
      this.lists.push({list:new Set(), caseTimeTotal: 0.0});
    }

    const remainingTests: Set<string> = new Set(this.allTestNames);
    const medianTime: number = timings.length === 0 ? 0.1 : timings[timings.length / 2].timing;

    // Add each test to the list that has the smallest total timing sum. Add the new timing
    // (or a placeholder value of the median time for new tests) to the running total of that list.
    timings.forEach((testWithTiming) => {
      const bestIndex = this.chooseBestList();
      const bestList = this.lists[bestIndex];
      bestList.list.add(testWithTiming.name);
      bestList.caseTimeTotal += testWithTiming.timing;

      log.debug(`Assigning ${testWithTiming.name} to list ${bestIndex}, which now has a ${bestList.caseTimeTotal} estimated runtime (previously ${bestList.caseTimeTotal - testWithTiming.timing})`);

      remainingTests.delete(testWithTiming.name);
    });

    // These are the tests from _allTestNames_ that did not have timing data in the junit summary.
    // We'll estimate their time using the median time from the tests in the summary.
    remainingTests.forEach((name) => {
      const bestList = this.lists[this.chooseBestList()];

      bestList.list.add(name)
      bestList.caseTimeTotal += medianTime;
    });
  }

  public listFilterFunc(line: string): boolean {
    if(this.lists === undefined) {
      this.precomputeTestLists();
    }

    // Return true if the list at _index_ contains the test name
    return line.startsWith("Test") && this.lists[this.index].list.has(line);
  }
}
