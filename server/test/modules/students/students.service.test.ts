import { StudentsService } from "../../../src/modules/students/students.service";
import type { Student, StudentRepository } from "../../../src/modules/students/students.repository";

const student: Student = { ra: 123, name: "Ana" };
const makeRepository = () => ({ create: jest.fn(), findAll: jest.fn(), findOne: jest.fn() });

describe("StudentsService", () => {
  let repository: ReturnType<typeof makeRepository>;
  let service: StudentsService;

  beforeEach(() => {
    repository = makeRepository();
    service = new StudentsService(repository as unknown as StudentRepository);
  });

  it("creates a valid student and forwards its data", async () => {
    repository.create.mockResolvedValue(student);
    await expect(service.create({ ra: 123, name: "Ana" })).resolves.toBe(student);
    expect(repository.create).toHaveBeenCalledWith({ ra: 123, name: "Ana" });
  });

  it("rejects an invalid RA without creating a student", async () => {
    await expect(service.create({ ra: 0, name: "Ana" })).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("translates a duplicate RA to HTTP 409", async () => {
    repository.create.mockRejectedValue({ code: "23505" });
    await expect(service.create({ ra: 123, name: "Ana" })).rejects.toMatchObject({ statusCode: 409 });
  });

  it("translates a missing student to HTTP 404", async () => {
    repository.findOne.mockResolvedValue(undefined);
    await expect(service.findOne(123)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("propagates unexpected create errors unchanged", async () => {
    const error = new Error("database unavailable");
    repository.create.mockRejectedValue(error);
    await expect(service.create({ ra: 123, name: "Ana" })).rejects.toBe(error);
  });

  it("returns the student list and calls findAll once without arguments", async () => {
    const students = [student];
    repository.findAll.mockResolvedValue(students);
    await expect(service.findAll()).resolves.toBe(students);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.findAll).toHaveBeenCalledWith();
  });

  it("returns an existing student and forwards its RA once", async () => {
    repository.findOne.mockResolvedValue(student);
    await expect(service.findOne(123)).resolves.toBe(student);
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123);
  });
});
