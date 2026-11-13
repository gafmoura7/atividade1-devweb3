import type { Database } from "../../../src/database/connection";
import { PgEnrollmentRepository } from "../../../src/modules/enrollments/enrollments.repository";

const normalize = (sql: string) => sql.replace(/\s+/g, " ").trim();
const enrolledAt = new Date("2025-01-01T00:00:00.000Z");
const enrollment = { studentRa: 123, courseId: 7, enrolledAt };
const selectedColumns = 'student_ra AS "studentRa", course_id AS "courseId", enrolled_at AS "enrolledAt"';

describe("PgEnrollmentRepository", () => {
  let query: jest.Mock;
  let repository: PgEnrollmentRepository;

  beforeEach(() => {
    query = jest.fn();
    repository = new PgEnrollmentRepository({ query } as unknown as Database);
  });

  it("inserts an enrollment with parameterized keys and camelCase return aliases", async () => {
    query.mockResolvedValue({ rows: [enrollment] });
    await expect(repository.create(123, 7)).resolves.toEqual(enrollment);
    expect(query).toHaveBeenCalledTimes(1);
    expect(normalize(query.mock.calls[0][0])).toBe(`INSERT INTO enrollments (student_ra, course_id) VALUES ($1, $2) RETURNING ${selectedColumns}`);
    expect(query.mock.calls[0][1]).toEqual([123, 7]);
  });

  it("lists enrollments in student and course order using camelCase aliases", async () => {
    query.mockResolvedValue({ rows: [enrollment] });
    await expect(repository.findAll()).resolves.toEqual([enrollment]);
    expect(query).toHaveBeenCalledTimes(1);
    expect(normalize(query.mock.calls[0][0])).toBe(`SELECT ${selectedColumns} FROM enrollments ORDER BY student_ra, course_id`);
    expect(query.mock.calls[0]).toHaveLength(1);
  });

  it("returns an empty array when no enrollments exist", async () => {
    query.mockResolvedValue({ rows: [] });
    await expect(repository.findAll()).resolves.toEqual([]);
  });

  it("finds an enrollment by both keys and preserves aliases and date", async () => {
    query.mockResolvedValue({ rows: [enrollment] });
    const result = await repository.findOne(123, 7);
    expect(result).toEqual(enrollment);
    expect(result?.studentRa).toBe(123);
    expect(result?.courseId).toBe(7);
    expect(result?.enrolledAt).toBe(enrolledAt);
    expect(query).toHaveBeenCalledTimes(1);
    expect(normalize(query.mock.calls[0][0])).toBe(`SELECT ${selectedColumns} FROM enrollments WHERE student_ra = $1 AND course_id = $2`);
    expect(query.mock.calls[0][1]).toEqual([123, 7]);
  });

  it("returns undefined when an enrollment is not found", async () => {
    query.mockResolvedValue({ rows: [] });
    await expect(repository.findOne(123, 7)).resolves.toBeUndefined();
  });

  it.each(["create", "findAll", "findOne"] as const)("propagates database errors from %s unchanged", async (method) => {
    const error = new Error(`query failed during ${method}`);
    query.mockRejectedValue(error);
    const operation = method === "create" ? repository.create(123, 7) : method === "findAll" ? repository.findAll() : repository.findOne(123, 7);
    await expect(operation).rejects.toBe(error);
  });
});
