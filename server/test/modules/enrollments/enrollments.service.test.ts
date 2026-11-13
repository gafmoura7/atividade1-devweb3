import { EnrollmentsService } from "../../../src/modules/enrollments/enrollments.service";
import type { Enrollment, EnrollmentRepository } from "../../../src/modules/enrollments/enrollments.repository";

const enrollment: Enrollment = { studentRa: 123, courseId: 1, enrolledAt: new Date("2025-01-01T00:00:00.000Z") };
const makeRepository = () => ({ create: jest.fn(), findAll: jest.fn(), findOne: jest.fn() });

describe("EnrollmentsService", () => {
  let repository: ReturnType<typeof makeRepository>;
  let service: EnrollmentsService;

  beforeEach(() => {
    repository = makeRepository();
    service = new EnrollmentsService(repository as unknown as EnrollmentRepository);
  });

  it("creates an enrollment with the student RA and course ID in order", async () => {
    repository.create.mockResolvedValue(enrollment);
    await expect(service.create({ studentRa: 123, courseId: 1 })).resolves.toBe(enrollment);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(123, 1);
  });

  test.each([
    [{ studentRa: 0, courseId: 1 }],
    [{ studentRa: 123, courseId: 0 }],
  ])("rejects invalid enrollment keys %p without repository call", async (input) => {
    await expect(service.create(input)).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("translates missing student or course to HTTP 404", async () => {
    repository.create.mockRejectedValue({ code: "23503" });
    await expect(service.create({ studentRa: 123, courseId: 1 })).rejects.toMatchObject({ statusCode: 404 });
  });

  it("translates duplicate enrollment to HTTP 409", async () => {
    repository.create.mockRejectedValue({ code: "23505" });
    await expect(service.create({ studentRa: 123, courseId: 1 })).rejects.toMatchObject({ statusCode: 409 });
  });

  it("reports a missing enrollment as HTTP 404 and forwards both keys", async () => {
    repository.findOne.mockResolvedValue(undefined);
    await expect(service.findOne(123, 1)).rejects.toMatchObject({ statusCode: 404 });
    expect(repository.findOne).toHaveBeenCalledWith(123, 1);
  });

  it("propagates unexpected create errors unchanged", async () => {
    const error = new Error("database unavailable");
    repository.create.mockRejectedValue(error);
    await expect(service.create({ studentRa: 123, courseId: 1 })).rejects.toBe(error);
  });

  it("returns the enrollment list and calls findAll once without arguments", async () => {
    const enrollments = [enrollment];
    repository.findAll.mockResolvedValue(enrollments);
    await expect(service.findAll()).resolves.toBe(enrollments);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.findAll).toHaveBeenCalledWith();
  });

  it("returns an existing enrollment and forwards both keys in order", async () => {
    repository.findOne.mockResolvedValue(enrollment);
    await expect(service.findOne(123, 1)).resolves.toBe(enrollment);
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123, 1);
  });
});
