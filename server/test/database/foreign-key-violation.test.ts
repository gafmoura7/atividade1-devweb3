import { isForeignKeyViolation } from "../../src/database/foreign-key-violation";

describe("isForeignKeyViolation", () => {
  it("recognizes PostgreSQL foreign key violation code 23503", () => {
    expect(isForeignKeyViolation({ code: "23503" })).toBe(true);
  });

  test.each([null, undefined, "23505", 23503, {}, { code: "outro" }])(
    "does not recognize %p as a foreign key violation",
    (value) => expect(isForeignKeyViolation(value)).toBe(false),
  );
});
