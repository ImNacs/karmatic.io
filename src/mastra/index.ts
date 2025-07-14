/**
 * @fileoverview Mastra instance configuration
 * @module mastra
 */

import { Mastra } from "@mastra/core";
import { basicAgent } from "./agents/basic";

/**
 * Initialize Mastra instance with minimal configuration
 */
export const mastra = new Mastra({
  agents: {
    basic: basicAgent,
  },
});

export default mastra;