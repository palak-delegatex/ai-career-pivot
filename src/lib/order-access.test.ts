import { describe, expect, it } from "vitest";
import { signOrderAccess, readOrderAccess, ORDER_ACCESS_SECONDS } from "./order-access";
describe("purchase browser capability", () => {
 const key = "fixture-key-never-used-outside-tests";
 it("accepts only an intact unexpired signature", () => {
  const value = signOrderAccess("cs_fixture", key, 1000);
  expect(readOrderAccess(value, key, 1001)).toBe("cs_fixture");
  expect(readOrderAccess(value + "x", key, 1001)).toBeNull();
  expect(readOrderAccess(value, "wrong-key", 1001)).toBeNull();
  expect(readOrderAccess(value, key, 1000 + ORDER_ACCESS_SECONDS * 1000)).toBeNull();
  expect(readOrderAccess(undefined, key)).toBeNull();
 });
});
