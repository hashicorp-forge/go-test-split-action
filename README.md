# go-test-split-action

Given some splitting parameters (`total` slices and slice `index`), this action generates a list of tests that is suitable for passing into `go test -run`

## Inputs

### `total`

**Required** The total number of slices there are. Must be greater than 0.

### `index`

**Required** The zero-based index of the slice you want to generate. Must be less than total and greater than or equal to 0.

## Outputs

### `run`

A string containing the tests to run that is suitable for use in the go test `-run` argument.

## Example Usage

```yaml
strategy:
  fail-fast: false
  matrix:
    parallel: 2
    index: [0, 1]
steps:
  - name: Generate go test Slice
    id: test_split
    uses: brandonc/go-test-split-action@v0.1
    with:
      total: ${{ matrix.parallel }}
      index: ${{ matrix.index }}
  - name: Run Tests
    run: |
      go test ./... -run "${{ steps.test_split.outputs.run}}"
```

## Notes

Lists tests by executing `go test ./... -list .` in the `GITHUB_WORKSPACE` (checkout) directory. Use the `packages` input to customize the packages string, and the `list` input to customize the list pattern. (See action.yml for details)
