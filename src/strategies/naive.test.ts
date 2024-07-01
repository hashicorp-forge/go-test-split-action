/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import NaiveStrategy from "./naive";

describe("naive splitting strategy", () => {
  describe("even numbers of tests", () => {
    const tests = ["Test0", "Test1", "Test2", "Test3"];

    it("even numbers of nodes", () => {
      const node0 = new NaiveStrategy(2, 0);
      const node1 = new NaiveStrategy(2, 1);

      expect<string[]>(
        tests.filter(node0.listFilterFunc.bind(node0)),
      ).toStrictEqual(["Test0", "Test2"]);
      expect<string[]>(
        tests.filter(node1.listFilterFunc.bind(node1)),
      ).toStrictEqual(["Test1", "Test3"]);
    });

    it("odd numbers of nodes", () => {
      const node0 = new NaiveStrategy(3, 0);
      const node1 = new NaiveStrategy(3, 1);
      const node2 = new NaiveStrategy(3, 2);

      expect<string[]>(
        tests.filter(node0.listFilterFunc.bind(node0)),
      ).toStrictEqual(["Test0", "Test3"]);
      expect<string[]>(
        tests.filter(node1.listFilterFunc.bind(node1)),
      ).toStrictEqual(["Test1"]);
      expect<string[]>(
        tests.filter(node2.listFilterFunc.bind(node2)),
      ).toStrictEqual(["Test2"]);
    });
  });

  describe("odd numbers of tests", () => {
    const tests = ["Test0", "Test1", "Test2", "Test3", "Test4"];

    it("even numbers of nodes", () => {
      const node0 = new NaiveStrategy(2, 0);
      const node1 = new NaiveStrategy(2, 1);

      expect<string[]>(
        tests.filter(node0.listFilterFunc.bind(node0)),
      ).toStrictEqual(["Test0", "Test2", "Test4"]);
      expect<string[]>(
        tests.filter(node1.listFilterFunc.bind(node1)),
      ).toStrictEqual(["Test1", "Test3"]);
    });

    it("odd numbers of nodes", () => {
      const node0 = new NaiveStrategy(3, 0);
      const node1 = new NaiveStrategy(3, 1);
      const node2 = new NaiveStrategy(3, 2);

      expect<string[]>(
        tests.filter(node0.listFilterFunc.bind(node0)),
      ).toStrictEqual(["Test0", "Test3"]);
      expect<string[]>(
        tests.filter(node1.listFilterFunc.bind(node1)),
      ).toStrictEqual(["Test1", "Test4"]);
      expect<string[]>(
        tests.filter(node2.listFilterFunc.bind(node2)),
      ).toStrictEqual(["Test2"]);
    });
  });
});
