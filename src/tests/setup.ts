import { handlers } from "@/tests/mocks/handlers";
import * as matchers from "@testing-library/jest-dom/matchers";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect } from "vitest";

// Extend expect with jest-dom matchers
expect.extend(matchers);

// Setup MSW server for API mocking
export const server = setupServer(...handlers);

beforeAll(() => {
  // Start the interception
  server.listen({
    onUnhandledRequest: "error",
  });
});

afterEach(() => {
  // Reset handlers between tests
  server.resetHandlers();
});

afterAll(() => {
  // Clean up
  server.close();
});
