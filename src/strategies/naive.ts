export default class NaiveStrategy {
  private total: number;
  private index: number;

  constructor(total: number, index: number) {
    this.total = total;
    this.index = index;
  }

  public listFilterFunc(line: string, testIndex: number): boolean {
    return line.startsWith("Test") && testIndex % this.total === this.index;
  }
}
