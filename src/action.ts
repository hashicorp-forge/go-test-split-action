/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as core from "@actions/core";

import {setupGoTestLister} from "./go-test";
(async () => {
  try {
    await core.group("Generate go test Slice", setupGoTestLister());
  } catch (error) {
    core.setFailed(error.message);
  }
})();
