import { isUniqueViolation } from "../../src/database/unique-violation";

describe("isUniqueViolation", () => {
  it("recognizes PostgreSQL unique violation code 23505", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
  });

  test.each([null, undefined, "23505", 23503, {}, { code: "outro" }])(
    "does not recognize %p as a unique violation",
    (value) => expect(isUniqueViolation(value)).toBe(false),
  );
});
