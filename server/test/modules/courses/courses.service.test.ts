import { CoursesService } from "../../../src/modules/courses/courses.service";
import type { Course, CourseRepository } from "../../../src/modules/courses/courses.repository";

const course: Course = { id: 1, name: "Qualidade" };
const makeRepository = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
});

describe("CoursesService", () => {
  let repository: ReturnType<typeof makeRepository>;
  let service: CoursesService;

  beforeEach(() => {
    repository = makeRepository();
    service = new CoursesService(repository as unknown as CourseRepository);
  });

  it("creates a valid course and forwards only validated data", async () => {
    repository.create.mockResolvedValue(course);
    await expect(service.create({ name: "Qualidade" })).resolves.toBe(course);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith({ name: "Qualidade" });
  });

  test.each([null, {}, { name: "A" }])("rejects invalid input %p without repository call", async (input) => {
    await expect(service.create(input)).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("translates duplicate course name to HTTP 409", async () => {
    repository.create.mockRejectedValue({ code: "23505" });
    await expect(service.create({ name: "Qualidade" })).rejects.toMatchObject({ statusCode: 409 });
  });

  it("lists courses using the repository stub", async () => {
    const courses = [course];
    repository.findAll.mockResolvedValue(courses);
    await expect(service.findAll()).resolves.toBe(courses);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });

  it("returns an existing course and forwards its ID", async () => {
    repository.findOne.mockResolvedValue(course);
    await expect(service.findOne(123)).resolves.toBe(course);
    expect(repository.findOne).toHaveBeenCalledWith(123);
  });

  it("translates a missing course to HTTP 404", async () => {
    repository.findOne.mockResolvedValue(undefined);
    await expect(service.findOne(123)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("rejects an invalid ID before consulting the repository", async () => {
    await expect(service.findOne(0)).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.findOne).not.toHaveBeenCalled();
  });

  it.each(["create", "findAll", "findOne"] as const)("propagates unexpected %s errors unchanged", async (method) => {
    const error = new Error(`unexpected ${method} failure`);
    if (method === "create") repository.create.mockRejectedValue(error);
    if (method === "findAll") repository.findAll.mockRejectedValue(error);
    if (method === "findOne") repository.findOne.mockRejectedValue(error);
    const operation = method === "create" ? service.create({ name: "Qualidade" }) : method === "findAll" ? service.findAll() : service.findOne(1);
    await expect(operation).rejects.toBe(error);
  });

  it("observes findOne on an existing stub with a spy", async () => {
    const stub = {
      create: async () => course,
      findAll: async () => [course],
      findOne: async (_id: number) => course,
    };
    const spy = jest.spyOn(stub, "findOne");
    const serviceWithSpy = new CoursesService(stub);
    await expect(serviceWithSpy.findOne(1)).resolves.toBe(course);
    expect(spy).toHaveBeenCalledWith(1);
  });

  it("strips extra input fields before calling the repository", async () => {
    repository.create.mockResolvedValue(course);
    await service.create({ name: "Qualidade", extra: true });
    expect(repository.create).toHaveBeenCalledWith({ name: "Qualidade" });
  });
});
