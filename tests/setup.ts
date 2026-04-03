/**
 * tests/setup.ts
 * Global test setup — runs before every test file.
 * Initializes MSW server for HTTP mocking.
 */
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./mocks/server.js";

// Start MSW before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));

// Reset handlers after each test so overrides don't leak
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());
