import type { Database } from "../../../src/database/connection";
import { PgCourseRepository } from "../../../src/modules/courses/courses.repository";

const normalize = (sql: string) => sql.replace(/\s+/g, " ").trim();
const course = { id: 7, name: "Qualidade" };

describe("PgCourseRepository", () => {
  let query: jest.Mock;
  let repository: PgCourseRepository;

  beforeEach(() => {
    query = jest.fn();
    repository = new PgCourseRepository({ query } as unknown as Database);
  });

  it("inserts a course with parameterized values and returns its row", async () => {
    query.mockResolvedValue({ rows: [course] });
    await expect(repository.create({ name: "Qualidade" })).resolves.toEqual(course);
    expect(query).toHaveBeenCalledTimes(1);
    expect(normalize(query.mock.calls[0][0])).toBe("INSERT INTO courses (name) VALUES ($1) RETURNING id, name");
    expect(query.mock.calls[0][1]).toEqual(["Qualidade"]);
  });

  it("lists courses in ID order", async () => {
    query.mockResolvedValue({ rows: [course] });
    await expect(repository.findAll()).resolves.toEqual([course]);
    expect(query).toHaveBeenCalledTimes(1);
    expect(normalize(query.mock.calls[0][0])).toBe("SELECT id, name FROM courses ORDER BY id");
    expect(query.mock.calls[0]).toHaveLength(1);
  });

  it("returns an empty array when no courses exist", async () => {
    query.mockResolvedValue({ rows: [] });
    await expect(repository.findAll()).resolves.toEqual([]);
  });

  it("finds a course by ID with a parameterized filter", async () => {
    query.mockResolvedValue({ rows: [course] });
    await expect(repository.findOne(7)).resolves.toEqual(course);
    expect(query).toHaveBeenCalledTimes(1);
    expect(normalize(query.mock.calls[0][0])).toBe("SELECT id, name FROM courses WHERE id = $1");
    expect(query.mock.calls[0][1]).toEqual([7]);
  });

  it("returns undefined when a course is not found", async () => {
    query.mockResolvedValue({ rows: [] });
    await expect(repository.findOne(7)).resolves.toBeUndefined();
  });

  it.each(["create", "findAll", "findOne"] as const)("propagates database errors from %s unchanged", async (method) => {
    const error = new Error(`query failed during ${method}`);
    query.mockRejectedValue(error);
    const operation = method === "create" ? repository.create({ name: "Qualidade" }) : method === "findAll" ? repository.findAll() : repository.findOne(7);
    await expect(operation).rejects.toBe(error);
  });
});
