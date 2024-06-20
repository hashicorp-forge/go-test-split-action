# go-test-split-action

Given some splitting parameters (`total` slices and slice `index`), this action generates a list of tests that is suitable for passing into `go test -run`

## Inputs

### `total`

**Required** The total number of slices there are. Must be greater than 0.

### `index`

**Required** The zero-based index of the slice you want to generate. Must be less than total and greater than or equal to 0.

See [Advanced Options](#advanced-options) more input options.

## Outputs

### `run`

A string containing the tests to run that is suitable for use in the go test `-run` argument.

## Basic Usage

```yaml
strategy:
  fail-fast: false
  matrix:
    parallel: [2]
    index: [0, 1]
steps:
  - name: Generate go test Slice
    id: test_split
    uses: hashicorp-forge/go-test-split-action@v1
    with:
      total: ${{ matrix.parallel }}
      index: ${{ matrix.index }}
  - name: Run Tests
    run: |
      go test ./... -run "${{ steps.test_split.outputs.run}}"
```

## How Does it Work?

List tests using go tooling by executing `go test ./... -list .` in the `GITHUB_WORKSPACE` (checkout) directory. The package spec and other go test parameters can be set using additional input variables (see below)

## Advanced Options

Use the `packages` input to customize the packages string, and the `list` input to customize the list pattern. Pass additional test flags using `flags` (See action.yml for details)

Use the `working-directory` input to change the directory from which
tests are listed.

### Better Test Balancing using `junit-summary`

Normally, test splitting is achieved by balancing the quantity of tests across the _total_ slices.

A more balanced test splitting strategy can be achieved if you provide a JUnit test summary (XML format), commonly generated using the [gotestsum package](https://github.com/gotestyourself/gotestsum).

Usually this means combining JUnit output from your newly split test runners and merging those together before utilizing it in the next CI run. Until a more complete composite workflow is developed, you can assemble a workflow that does the following steps to take advantage of this option, using additional steps that merge, upload, and download the appropriate summary XML. This workflow is likely to need to be customized for your project, and is for illustrative purposes only.

It's likely to take at least 2 push or PR events to see the actual timing improvement: 1. To succeed in uploading the report using the naive ordering and 2. To succeed in downloading and using the report.

```yaml
name: CI Tests
on:
  push:
    branches: [ main ]
  pull_request:
jobs:
  tests:
    name: Test
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        parallel: [3]
        index: [0, 1, 2]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Go
        uses: actions/setup-go@v5

      - name: Install gotestsum
        run: go install gotest.tools/gotestsum@latest

      - name: Download JUnit Summary from Previous Workflow
        id: download-artifact
        uses: dawidd6/action-download-artifact@v4
        with:
          workflow_conclusion: success
          name: junit-test-summary
          if_no_artifact_found: warn
          # Uncomment the next line before pushing to main branch, that way all branches can
          # benefit from timing data once it's established there.
          # branch: main

      - name: Split integration tests
        id: test_split
        uses: hashicorp-forge/go-test-split-action@v1
        with:
          index: ${{ matrix.index }}
          total: ${{ matrix.parallel }}
          junit-summary: ./junit-test-summary.xml

      - name: Go test
        run: |
          gotestsum --junitfile node-summary.xml --format short-verbose -- -run "${{ steps.test_split.outputs.run }}"

      - name: Upload test artifacts
        uses: actions/upload-artifact@v4
        with:
          name: junit-test-summary-${{ matrix.index }}
          path: node-summary.xml
          retention-days: 1

  tests-combine-summaries:
    name: Combine Test Reports
    needs: [ tests ]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Download artifacts
        uses: actions/download-artifact@v4

      - name: Install junit-report-merger
        run: npm install -g junit-report-merger

      - name: Merge reports
        run: jrm ./junit-test-summary.xml "junit-test-summary-0/*.xml" "junit-test-summary-1/*.xml" "junit-test-summary-2/*.xml"

      - name: Upload test artifacts
        uses: actions/upload-artifact@v4
        with:
          name: junit-test-summary
          path: ./junit-test-summary.xml
```
