import * as core from "@actions/core";

import {setupGoTestLister} from "./go-test";

describe("outputTestList", () => {
  let inputSpy: jest.SpyInstance;
  let outputSpy: jest.SpyInstance;

  let inputs: any;
  let outputs: any;

  const exampleAppEnv = {
    GO111MODULE: "off",
    GOPATH: process.cwd() + "/test-fixtures/example-app",
  };

  beforeEach(() => {
    inputs = {};
    outputs = {};

    inputSpy = jest.spyOn(core, "getInput");
    inputSpy.mockImplementation(name => inputs[name]);

    outputSpy = jest.spyOn(core, "setOutput");
    outputSpy.mockImplementation((name, value) => (outputs[name] = value));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("lists all tests for 0 of 1", async () => {
    inputs.total = "1";
    inputs.index = "0";

    await setupGoTestLister(exampleAppEnv)();

    expect(outputs["run"]).toStrictEqual(
      "^(?:TestExample0|TestExample1|TestExample2|TestExample3|TestExample4)$"
    );
  });

  it("lists first test for 0 of 5", async () => {
    inputs.total = "5";
    inputs.index = "0";

    await setupGoTestLister(exampleAppEnv)();

    expect(outputs["run"]).toStrictEqual("^(?:TestExample0)$");
  });

  it("lists first, fourth test for 0 of 3", async () => {
    inputs.total = "3";
    inputs.index = "0";

    await setupGoTestLister(exampleAppEnv)();

    expect(outputs["run"]).toStrictEqual("^(?:TestExample0|TestExample3)$");
  });

  it("lists second, fifth test for 1 of 3", async () => {
    inputs.total = "3";
    inputs.index = "1";

    await setupGoTestLister(exampleAppEnv)();

    expect(outputs["run"]).toStrictEqual("^(?:TestExample1|TestExample4)$");
  });

  it("lists third test for 2 of 3", async () => {
    inputs.total = "3";
    inputs.index = "2";

    await setupGoTestLister(exampleAppEnv)();

    expect(outputs["run"]).toStrictEqual("^(?:TestExample2)$");
  });

  it("throws range error for invalid index", async () => {
    inputs.total = "3";
    inputs.index = "3";

    expect(async () => {
      await setupGoTestLister(exampleAppEnv)();
    }).rejects.toThrow(
      "Slice index out of range: Requested index 3 of 3 total slices"
    );
  });

  it("return unexpected input error for invalid total", async () => {
    inputs.total = "zombie";
    inputs.index = "";

    expect(async () => {
      await setupGoTestLister(exampleAppEnv)();
    }).rejects.toThrow('Unexpected input: index "" of "zombie" total');
  });

  it("customizes test list pattern using list input", async () => {
    inputs.total = "1";
    inputs.index = "0";
    inputs.list = "Example[2,3]";

    await setupGoTestLister(exampleAppEnv)();

    expect(outputs["run"]).toStrictEqual("^(?:TestExample2|TestExample3)$");
  });
});
