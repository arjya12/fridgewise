import { parseNotificationIdsFromRow } from "../notificationIdsParse";

describe("parseNotificationIdsFromRow", () => {
  it("returns empty array for null and undefined", () => {
    expect(parseNotificationIdsFromRow(null)).toEqual([]);
    expect(parseNotificationIdsFromRow(undefined)).toEqual([]);
  });

  it("filters arrays to strings only", () => {
    expect(parseNotificationIdsFromRow(["a", "b", 3, null, {}, "c"])).toEqual(["a", "b", "c"]);
    expect(parseNotificationIdsFromRow([])).toEqual([]);
  });

  it("parses JSON string arrays", () => {
    expect(parseNotificationIdsFromRow('["x","y"]')).toEqual(["x", "y"]);
  });

  it("returns empty for invalid JSON string", () => {
    expect(parseNotificationIdsFromRow("{not json")).toEqual([]);
  });

  it("returns empty when JSON string is not an array", () => {
    expect(parseNotificationIdsFromRow('{"ids":["a"]}')).toEqual([]);
  });

  it("returns empty for non-array non-string primitives", () => {
    expect(parseNotificationIdsFromRow(42)).toEqual([]);
    expect(parseNotificationIdsFromRow(true)).toEqual([]);
    expect(parseNotificationIdsFromRow({ id: "nope" })).toEqual([]);
  });
});
