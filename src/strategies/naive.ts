/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

export default class NaiveStrategy {
  private total: number;
  private index: number;

  constructor(total: number, index: number) {
    this.total = total;
    this.index = index;
  }

  public listFilterFunc(_: string, testIndex: number): boolean {
    return testIndex % this.total === this.index;
  }
}
