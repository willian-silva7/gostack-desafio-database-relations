import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customerExist = await this.customersRepository.findById(customer_id);

    if (!customerExist) {
      throw new AppError('Customer not exist');
    }

    const productsExist = await this.productsRepository.findAllById(products);

    if (!productsExist.length) {
      throw new AppError('Products not found');
    }

    const productsList = productsExist.map(product => product.id);

    const checkAllProductsExist = products.filter(
      product => !productsList.includes(product.id),
    );

    if (checkAllProductsExist.length) {
      throw new AppError('could find all the products');
    }

    const checkQuantityAvailable = products.filter(
      product =>
        productsExist.filter(prod => prod.id === product.id)[0].quantity <
        product.quantity,
    );

    if (checkQuantityAvailable.length) {
      throw new AppError('product dont have quantity');
    }

    const serializedProducts = products.map(product => ({
      product_id: product.id,
      quantity: product.quantity,
      price: productsExist.filter(prod => prod.id === product.id)[0].price,
    }));

    const order = await this.ordersRepository.create({
      customer: customerExist,
      products: serializedProducts,
    });

    const orderUdateQuantity = products.map(product => ({
      id: product.id,
      quantity:
        productsExist.filter(prod => prod.id === product.id)[0].quantity -
        product.quantity,
    }));

    await this.productsRepository.updateQuantity(orderUdateQuantity);

    return order;
  }
}

export default CreateOrderService;
