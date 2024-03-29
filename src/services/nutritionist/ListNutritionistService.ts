import prismaClient from "../../prisma";

class ListNutritionistService {
  async execute() {
    const list = await prismaClient.nutritionist.findMany({
      include: {
        client: true,
        certificate: true,
      },
    });
    return list;
  }
}

export { ListNutritionistService };
