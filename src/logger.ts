/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as core from "@actions/core";

interface Logger {
  debug(msg: string): void;
  info(msg: string): void;
}

export const DefaultLogger: Logger = core;
