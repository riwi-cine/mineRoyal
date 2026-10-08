import { randomUUID } from 'node:crypto';
import { hash } from 'bcrypt';
import { DataSource, Repository } from 'typeorm';
import { Cart } from '../../../modules/cart/entities/cart.entity.js';
import { CartConcessionItem } from '../../../modules/cart/entities/cart-concession-item.entity.js';
import { Product } from '../../../modules/cart/entities/product.entity.js';
import { City } from '../../../modules/locations/entities/city.entity.js';
import { Country } from '../../../modules/locations/entities/country.entity.js';
import { Department } from '../../../modules/locations/entities/department.entity.js';
import { Membership } from '../../../modules/users/entities/membership.entity.js';
import { UserLocation } from '../../../modules/users/entities/user-location.entity.js';
import { User } from '../../../modules/users/entities/user.entity.js';

interface LocationContext {
  colombia: Country;
  antioquia: Department | null;
  medellin: City | null;
  cundinamarca: Department;
  bogota: City;
  valle: Department;
  cali: City;
}

interface UserSeedData {
  name: string;
  email: string;
  city: City | null;
  department: Department | null;
  membership: { tier: string; discountPercent: number; active: boolean } | null;
}

interface UserSeedRepos {
  userRepo: Repository<User>;
  membershipRepo: Repository<Membership>;
  userLocationRepo: Repository<UserLocation>;
  cartRepo: Repository<Cart>;
  cartItemRepo: Repository<CartConcessionItem>;
}

async function ensureLocations(dataSource: DataSource): Promise<LocationContext | null> {
  const countryRepo = dataSource.getRepository(Country);
  const departmentRepo = dataSource.getRepository(Department);
  const cityRepo = dataSource.getRepository(City);

  const colombia = await countryRepo.findOne({ where: { isoCode: 'CO' } });
  if (!colombia) return null;

  const antioquia = await departmentRepo.findOne({ where: { name: 'Antioquia', countryId: colombia.id } });
  const medellin = antioquia
    ? await cityRepo.findOne({ where: { name: 'Medellín', departmentId: antioquia.id } })
    : null;

  let cundinamarca = await departmentRepo.findOne({ where: { name: 'Cundinamarca', countryId: colombia.id } });
  cundinamarca ??= await departmentRepo.save(
    departmentRepo.create({ name: 'Cundinamarca', countryId: colombia.id, isActive: true }),
  );

  let bogota = await cityRepo.findOne({ where: { name: 'Bogotá D.C.', departmentId: cundinamarca.id } });
  bogota ??= await cityRepo.save(
    cityRepo.create({ name: 'Bogotá D.C.', departmentId: cundinamarca.id, isActive: true }),
  );

  let valle = await departmentRepo.findOne({ where: { name: 'Valle del Cauca', countryId: colombia.id } });
  valle ??= await departmentRepo.save(
    departmentRepo.create({ name: 'Valle del Cauca', countryId: colombia.id, isActive: true }),
  );

  let cali = await cityRepo.findOne({ where: { name: 'Cali', departmentId: valle.id } });
  cali ??= await cityRepo.save(cityRepo.create({ name: 'Cali', departmentId: valle.id, isActive: true }));

  return { colombia, antioquia, medellin, cundinamarca, bogota, valle, cali };
}

async function seedConfectioneryProducts(productRepo: Repository<Product>): Promise<Map<string, Product>> {
  const sampleProducts = [
    { name: 'Crispetas Grandes Saladas', price: 18500, stock: 150, active: true },
    { name: 'Gaseosa 32oz', price: 9500, stock: 200, active: true },
    { name: 'Nachos con Queso y Jalapeño', price: 16000, stock: 8, active: true },
    { name: 'Combo Pareja (2 Crispetas + 2 Gaseosas + Chocolatina)', price: 42000, stock: 75, active: true },
    { name: 'Hot Dog Especial Royal', price: 14000, stock: 0, active: true },
    { name: 'Chocolatina Premium Dark 70%', price: 7000, stock: 50, active: true },
  ];

  const products = await Promise.all(
    sampleProducts.map(async (prodData) => {
      let prod = await productRepo.findOne({ where: { name: prodData.name } });
      prod ??= await productRepo.save(productRepo.create(prodData));
      return prod;
    }),
  );

  return new Map<string, Product>(products.map((prod) => [prod.name, prod]));
}

async function seedUserCarts(
  user: User,
  email: string,
  membershipActive: boolean,
  productsMap: Map<string, Product>,
  cartRepo: Repository<Cart>,
  cartItemRepo: Repository<CartConcessionItem>,
): Promise<void> {
  const existingCarts = await cartRepo.find({ where: { userId: user.id } });
  if (existingCarts.length > 0) return;

  if (email === 'alejandro@example.com' || email === 'carlos.mendoza@example.com') {
    const completedCart = await cartRepo.save({
      id: randomUUID(),
      userId: user.id,
      status: 'CONVERTED' as const,
      membershipApplied: membershipActive,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    });

    const combo = productsMap.get('Combo Pareja (2 Crispetas + 2 Gaseosas + Chocolatina)');
    if (combo) {
      await cartItemRepo.save({
        id: randomUUID(),
        cartId: completedCart.id,
        productId: combo.id,
        quantity: 2,
        unitPrice: combo.price,
      });
    }

    await cartRepo.save({
      id: randomUUID(),
      userId: user.id,
      status: 'ACTIVE' as const,
      membershipApplied: false,
      expiresAt: new Date(Date.now() + 8 * 60 * 1000),
      createdAt: new Date(),
    });
  } else if (email === 'laura.torres@example.com') {
    await cartRepo.save({
      id: randomUUID(),
      userId: user.id,
      status: 'EXPIRED' as const,
      membershipApplied: false,
      expiresAt: new Date(Date.now() - 20 * 60 * 1000),
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
    });
  }
}

async function seedSingleUser(
  item: UserSeedData,
  passwordHash: string,
  colombiaId: string,
  repos: UserSeedRepos,
  productsMap: Map<string, Product>,
): Promise<void> {
  let user = await repos.userRepo.findOne({ where: { email: item.email }, withDeleted: true });
  user ??= await repos.userRepo.save(
    repos.userRepo.create({
      name: item.name,
      email: item.email,
      passwordHash,
    }),
  );

  if (item.membership) {
    const existingMembership = await repos.membershipRepo.findOne({ where: { userId: user.id } });
    if (!existingMembership) {
      await repos.membershipRepo.save(
        repos.membershipRepo.create({
          userId: user.id,
          tier: item.membership.tier,
          discountPercent: item.membership.discountPercent,
          active: item.membership.active,
        }),
      );
    }
  }

  if (item.city && item.department) {
    const existingLocation = await repos.userLocationRepo.findOne({ where: { userId: user.id } });
    if (!existingLocation) {
      await repos.userLocationRepo.save(
        repos.userLocationRepo.create({
          userId: user.id,
          countryId: colombiaId,
          departmentId: item.department.id,
          cityId: item.city.id,
        }),
      );
    }
  }

  await seedUserCarts(
    user,
    item.email,
    Boolean(item.membership?.active),
    productsMap,
    repos.cartRepo,
    repos.cartItemRepo,
  );
}

async function seedDeletedUser(userRepo: Repository<User>, passwordHash: string): Promise<void> {
  const deletedEmail = 'usuario.eliminado@example.com';
  const deletedUser = await userRepo.findOne({ where: { email: deletedEmail }, withDeleted: true });
  if (!deletedUser) {
    await userRepo.save(
      userRepo.create({
        name: 'Usuario Baja Histórica',
        email: deletedEmail,
        passwordHash,
        deletedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      }),
    );
  }
}

function buildSeedUsersData(locations: LocationContext): UserSeedData[] {
  return [
    {
      name: 'Administrador MineRoyal',
      email: 'admin@mineroyal.com',
      city: locations.medellin,
      department: locations.antioquia,
      membership: { tier: 'PLATINUM', discountPercent: 25.0, active: true },
    },
    {
      name: 'Alejandro Morales (VIP Top Spender)',
      email: 'alejandro@example.com',
      city: locations.medellin,
      department: locations.antioquia,
      membership: { tier: 'PLATINUM', discountPercent: 25.0, active: true },
    },
    {
      name: 'Carlos Mendoza (Cliente Frecuente)',
      email: 'carlos.mendoza@example.com',
      city: locations.bogota,
      department: locations.cundinamarca,
      membership: { tier: 'GOLD', discountPercent: 15.0, active: true },
    },
    {
      name: 'María Gómez (Membresía Expirada)',
      email: 'maria.gomez@example.com',
      city: locations.cali,
      department: locations.valle,
      membership: { tier: 'STANDARD', discountPercent: 10.0, active: false },
    },
    {
      name: 'Laura Torres (Cliente Regular Activo)',
      email: 'laura.torres@example.com',
      city: locations.medellin,
      department: locations.antioquia,
      membership: null,
    },
    {
      name: 'Andrés Rodríguez (Cliente Nuevo)',
      email: 'andres.rodriguez@example.com',
      city: locations.bogota,
      department: locations.cundinamarca,
      membership: null,
    },
    {
      name: 'Camila Vargas (Cliente VIP Ocasional)',
      email: 'camila.vargas@example.com',
      city: locations.cali,
      department: locations.valle,
      membership: { tier: 'GOLD', discountPercent: 15.0, active: true },
    },
    {
      name: 'Pedro Inactivo (En Riesgo de Fuga)',
      email: 'pedro.inactivo@example.com',
      city: locations.medellin,
      department: locations.antioquia,
      membership: null,
    },
  ];
}

/**
 * Seeder integral de Usuarios, Membresías, Preferencias Geográficas y Carritos de compra.
 * Provee datos realistas para probar todas las consultas analíticas (RFM, LTV, Churn, Embudo).
 */
export async function seedUsers(dataSource: DataSource): Promise<void> {
  const locations = await ensureLocations(dataSource);
  if (!locations) return;

  const repos: UserSeedRepos = {
    userRepo: dataSource.getRepository(User),
    membershipRepo: dataSource.getRepository(Membership),
    userLocationRepo: dataSource.getRepository(UserLocation),
    cartRepo: dataSource.getRepository(Cart),
    cartItemRepo: dataSource.getRepository(CartConcessionItem),
  };

  const productsMap = await seedConfectioneryProducts(dataSource.getRepository(Product));
  const defaultPasswordHash = await hash('Password123!', 10);
  const usersData = buildSeedUsersData(locations);

  await Promise.all(
    usersData.map((item) => seedSingleUser(item, defaultPasswordHash, locations.colombia.id, repos, productsMap)),
  );

  await seedDeletedUser(repos.userRepo, defaultPasswordHash);
}
