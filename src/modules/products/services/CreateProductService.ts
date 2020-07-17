import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Product from '../infra/typeorm/entities/Product';
import IProductsRepository from '../repositories/IProductsRepository';

interface IRequest {
  name: string;
  price: number;
  quantity: number;
}

@injectable()
class CreateProductService {
  constructor(
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
  ) {}

  public async execute({ name, price, quantity }: IRequest): Promise<Product> {
    const productExist = await this.productsRepository.findByName(name);

    if (productExist) {
      throw new AppError('Product already exist');
    }

    const product = this.productsRepository.create({ name, quantity, price });

    return product;
  }
}

export default CreateProductService;
