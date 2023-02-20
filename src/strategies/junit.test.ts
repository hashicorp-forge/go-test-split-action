import JUnitStrategy from "./junit";

describe("junit splitting strategy", () => {
  const suite = process.cwd() + "/test-fixtures/junit/ci-summary.xml";
  const tests = [
    // Timings according to fixture:
    "Test0", // 1.00
    "Test1", // 0.40
    "Test2", // 0.40
    "Test3", // 1.59
  ];

  describe("1 node", () => {
    it("includes all tests", () => {
      const strategy = new JUnitStrategy(1, 0, suite, tests);
      expect<string[]>(
        tests.filter(strategy.listFilterFunc.bind(strategy))
      ).toStrictEqual(tests);
    });
  });

  describe("2 nodes", () => {
    it("balances tests by timing", () => {
      const node0 = new JUnitStrategy(2, 0, suite, tests);
      const node1 = new JUnitStrategy(2, 1, suite, tests);

      expect<string[]>(
        tests.filter(node0.listFilterFunc.bind(node0)).sort()
      ).toStrictEqual(["Test3"].sort());
      expect<string[]>(
        tests.filter(node1.listFilterFunc.bind(node1)).sort()
      ).toStrictEqual(["Test0", "Test1", "Test2"].sort());
    });
  });

  describe("3 nodes", () => {
    it("balances tests by timing", () => {
      const node0 = new JUnitStrategy(3, 0, suite, tests);
      const node1 = new JUnitStrategy(3, 1, suite, tests);
      const node2 = new JUnitStrategy(3, 2, suite, tests);

      expect<string[]>(
        tests.filter(node0.listFilterFunc.bind(node0)).sort()
      ).toStrictEqual(["Test3"].sort());
      expect<string[]>(
        tests.filter(node1.listFilterFunc.bind(node1)).sort()
      ).toStrictEqual(["Test0"].sort());
      expect<string[]>(
        tests.filter(node2.listFilterFunc.bind(node2)).sort()
      ).toStrictEqual(["Test1", "Test2"].sort());
    });
  });

  describe("when multiple suites are present", () => {
    const suite =
      process.cwd() + "/test-fixtures/junit/ci-summary-multiple-suites.xml";

    const tests = [
      // Timings according to fixture:
      "Test0", // 1.00
      "Test1", // 0.40
      "Test2", // 0.40
      "Test3", // 1.59
      "Test4", // 2.40
      "Test5", // 0.50
    ];

    describe("1 node", () => {
      it("includes all tests", () => {
        const strategy = new JUnitStrategy(1, 0, suite, tests);
        expect<string[]>(
          tests.filter(strategy.listFilterFunc.bind(strategy))
        ).toStrictEqual(tests);
      });
    });

    describe("2 nodes", () => {
      it("balances tests by timing", () => {
        const node0 = new JUnitStrategy(2, 0, suite, tests);
        const node1 = new JUnitStrategy(2, 1, suite, tests);

        expect<string[]>(
          tests.filter(node0.listFilterFunc.bind(node0)).sort()
        ).toStrictEqual(["Test2", "Test4", "Test5"].sort());
        expect<string[]>(
          tests.filter(node1.listFilterFunc.bind(node1)).sort()
        ).toStrictEqual(["Test0", "Test1", "Test3"].sort());
      });
    });

    describe("3 nodes", () => {
      it("balances tests by timing", () => {
        const node0 = new JUnitStrategy(3, 0, suite, tests);
        const node1 = new JUnitStrategy(3, 1, suite, tests);
        const node2 = new JUnitStrategy(3, 2, suite, tests);

        expect<string[]>(
          tests.filter(node0.listFilterFunc.bind(node0)).sort()
        ).toStrictEqual(["Test4"].sort()); // 2.40
        expect<string[]>(
          tests.filter(node1.listFilterFunc.bind(node1)).sort()
        ).toStrictEqual(["Test3", "Test2"].sort()); // 1.99
        expect<string[]>(
          tests.filter(node2.listFilterFunc.bind(node2)).sort()
        ).toStrictEqual(["Test0", "Test5", "Test1"].sort()); // 1.90
      });
    });

    describe("when tests are not in timing data", () => {
      const tests = [
        "Test0",
        "Test1",
        "Test2",
        "Test3",
        "Test4",
        "Test5",
        "Test6",
        "Test7",
        "Test8",
        "Test9",
      ];

      it("includes those tests anyway", () => {
        const node0 = new JUnitStrategy(1, 0, suite, tests);

        expect<string[]>(
          tests.filter(node0.listFilterFunc.bind(node0)).sort()
        ).toStrictEqual(tests.sort());
      });
    });
  });
});
