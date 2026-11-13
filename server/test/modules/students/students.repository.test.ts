import type { Database } from "../../../src/database/connection";
import { PgStudentRepository } from "../../../src/modules/students/students.repository";

const normalize = (sql: string) => sql.replace(/\s+/g, " ").trim();
const student = { ra: 123, name: "Ana" };

describe("PgStudentRepository", () => {
  let query: jest.Mock;
  let repository: PgStudentRepository;

  beforeEach(() => {
    query = jest.fn();
    repository = new PgStudentRepository({ query } as unknown as Database);
  });

  it("inserts a student with parameterized values and returns its row", async () => {
    query.mockResolvedValue({ rows: [student] });
    await expect(repository.create(student)).resolves.toEqual(student);
    expect(query).toHaveBeenCalledTimes(1);
    expect(normalize(query.mock.calls[0][0])).toBe("INSERT INTO students (ra, name) VALUES ($1, $2) RETURNING ra, name");
    expect(query.mock.calls[0][1]).toEqual([123, "Ana"]);
  });

  it("lists students in name order", async () => {
    query.mockResolvedValue({ rows: [student] });
    await expect(repository.findAll()).resolves.toEqual([student]);
    expect(query).toHaveBeenCalledTimes(1);
    expect(normalize(query.mock.calls[0][0])).toBe("SELECT ra, name FROM students ORDER BY name");
    expect(query.mock.calls[0]).toHaveLength(1);
  });

  it("returns an empty array when no students exist", async () => {
    query.mockResolvedValue({ rows: [] });
    await expect(repository.findAll()).resolves.toEqual([]);
  });

  it("finds a student by RA with a parameterized filter", async () => {
    query.mockResolvedValue({ rows: [student] });
    await expect(repository.findOne(123)).resolves.toEqual(student);
    expect(query).toHaveBeenCalledTimes(1);
    expect(normalize(query.mock.calls[0][0])).toBe("SELECT ra, name FROM students WHERE ra = $1");
    expect(query.mock.calls[0][1]).toEqual([123]);
  });

  it("returns undefined when a student is not found", async () => {
    query.mockResolvedValue({ rows: [] });
    await expect(repository.findOne(123)).resolves.toBeUndefined();
  });

  it.each(["create", "findAll", "findOne"] as const)("propagates database errors from %s unchanged", async (method) => {
    const error = new Error(`query failed during ${method}`);
    query.mockRejectedValue(error);
    const operation = method === "create" ? repository.create(student) : method === "findAll" ? repository.findAll() : repository.findOne(123);
    await expect(operation).rejects.toBe(error);
  });
});
