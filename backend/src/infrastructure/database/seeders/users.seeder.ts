import { randomUUID } from 'node:crypto';
import { hash } from 'bcrypt';
import { DataSource } from 'typeorm';
import { Cart } from '../../../modules/cart/entities/cart.entity.js';
import { CartConcessionItem } from '../../../modules/cart/entities/cart-concession-item.entity.js';
import { Product } from '../../../modules/cart/entities/product.entity.js';
import { City } from '../../../modules/locations/entities/city.entity.js';
import { Country } from '../../../modules/locations/entities/country.entity.js';
import { Department } from '../../../modules/locations/entities/department.entity.js';
import { Membership } from '../../../modules/users/entities/membership.entity.js';
import { UserLocation } from '../../../modules/users/entities/user-location.entity.js';
import { User } from '../../../modules/users/entities/user.entity.js';

/**
 * Seeder integral de Usuarios, Membresías, Preferencias Geográficas y Carritos de compra.
 * Provee datos realistas para probar todas las consultas analíticas (RFM, LTV, Churn, Embudo).
 */
export async function seedUsers(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(User);
  const membershipRepo = dataSource.getRepository(Membership);
  const userLocationRepo = dataSource.getRepository(UserLocation);
  const countryRepo = dataSource.getRepository(Country);
  const departmentRepo = dataSource.getRepository(Department);
  const cityRepo = dataSource.getRepository(City);
  const productRepo = dataSource.getRepository(Product);
  const cartRepo = dataSource.getRepository(Cart);
  const cartItemRepo = dataSource.getRepository(CartConcessionItem);

  // 1. Obtener ubicaciones base
  const colombia = await countryRepo.findOne({ where: { isoCode: 'CO' } });
  if (!colombia) return;

  const antioquia = await departmentRepo.findOne({ where: { name: 'Antioquia', countryId: colombia.id } });
  const medellin = antioquia ? await cityRepo.findOne({ where: { name: 'Medellín', departmentId: antioquia.id } }) : null;

  // 2. Crear departamentos y ciudades adicionales si no existen
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
  cali ??= await cityRepo.save(
    cityRepo.create({ name: 'Cali', departmentId: valle.id, isActive: true }),
  );

  // 3. Crear productos de confitería para alimentar consultas de ventas y carritos
  const sampleProducts = [
    { name: 'Crispetas Grandes Saladas', price: 18500, stock: 150, active: true },
    { name: 'Gaseosa 32oz', price: 9500, stock: 200, active: true },
    { name: 'Nachos con Queso y Jalapeño', price: 16000, stock: 8, active: true }, // Stock crítico
    { name: 'Combo Pareja (2 Crispetas + 2 Gaseosas + Chocolatina)', price: 42000, stock: 75, active: true },
    { name: 'Hot Dog Especial Royal', price: 14000, stock: 0, active: true }, // Agotado
    { name: 'Chocolatina Premium Dark 70%', price: 7000, stock: 50, active: true },
  ];

  const productsMap = new Map<string, Product>();
  for (const prodData of sampleProducts) {
    let prod = await productRepo.findOne({ where: { name: prodData.name } });
    prod ??= await productRepo.save(productRepo.create(prodData));
    productsMap.set(prod.name, prod);
  }

  // 4. Crear usuarios con contraseña cifrada
  const defaultPasswordHash = await hash('Password123!', 10);

  const usersData = [
    {
      name: 'Administrador MineRoyal',
      email: 'admin@mineroyal.com',
      city: medellin,
      department: antioquia,
      membership: { tier: 'PLATINUM', discountPercent: 25.0, active: true },
    },
    {
      name: 'Alejandro Morales (VIP Top Spender)',
      email: 'alejandro@example.com',
      city: medellin,
      department: antioquia,
      membership: { tier: 'PLATINUM', discountPercent: 25.0, active: true },
    },
    {
      name: 'Carlos Mendoza (Cliente Frecuente)',
      email: 'carlos.mendoza@example.com',
      city: bogota,
      department: cundinamarca,
      membership: { tier: 'GOLD', discountPercent: 15.0, active: true },
    },
    {
      name: 'María Gómez (Membresía Expirada)',
      email: 'maria.gomez@example.com',
      city: cali,
      department: valle,
      membership: { tier: 'STANDARD', discountPercent: 10.0, active: false },
    },
    {
      name: 'Laura Torres (Cliente Regular Activo)',
      email: 'laura.torres@example.com',
      city: medellin,
      department: antioquia,
      membership: null,
    },
    {
      name: 'Andrés Rodríguez (Cliente Nuevo)',
      email: 'andres.rodriguez@example.com',
      city: bogota,
      department: cundinamarca,
      membership: null,
    },
    {
      name: 'Camila Vargas (Cliente VIP Ocasional)',
      email: 'camila.vargas@example.com',
      city: cali,
      department: valle,
      membership: { tier: 'GOLD', discountPercent: 15.0, active: true },
    },
    {
      name: 'Pedro Inactivo (En Riesgo de Fuga)',
      email: 'pedro.inactivo@example.com',
      city: medellin,
      department: antioquia,
      membership: null,
    },
  ];

  for (const item of usersData) {
    let user = await userRepo.findOne({ where: { email: item.email }, withDeleted: true });
    if (!user) {
      user = await userRepo.save(
        userRepo.create({
          name: item.name,
          email: item.email,
          passwordHash: defaultPasswordHash,
        }),
      );
    }

    // Configurar membresía
    if (item.membership) {
      const existingMembership = await membershipRepo.findOne({ where: { userId: user.id } });
      if (!existingMembership) {
        await membershipRepo.save(
          membershipRepo.create({
            userId: user.id,
            tier: item.membership.tier,
            discountPercent: item.membership.discountPercent,
            active: item.membership.active,
          }),
        );
      }
    }

    // Configurar ubicación geográfica preferida
    if (item.city && item.department) {
      const existingLocation = await userLocationRepo.findOne({ where: { userId: user.id } });
      if (!existingLocation) {
        await userLocationRepo.save(
          userLocationRepo.create({
            userId: user.id,
            countryId: colombia.id,
            departmentId: item.department.id,
            cityId: item.city.id,
          }),
        );
      }
    }

    // 5. Crear carritos de prueba con historial de compras para consultas RFM y LTV
    if (item.email === 'alejandro@example.com' || item.email === 'carlos.mendoza@example.com') {
      const existingCarts = await cartRepo.find({ where: { userId: user.id } });
      if (existingCarts.length === 0) {
        // Carrito 1: Completado / Convertido hace 3 días
        const completedCart = await cartRepo.save({
          id: randomUUID(),
          userId: user.id,
          status: 'CONVERTED' as const,
          membershipApplied: Boolean(item.membership?.active),
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

        // Carrito 2: Activo en este momento
        await cartRepo.save({
          id: randomUUID(),
          userId: user.id,
          status: 'ACTIVE' as const,
          membershipApplied: false,
          expiresAt: new Date(Date.now() + 8 * 60 * 1000), // Faltan 8 minutos
          createdAt: new Date(),
        });
      }
    }

    if (item.email === 'laura.torres@example.com') {
      const existingCarts = await cartRepo.find({ where: { userId: user.id } });
      if (existingCarts.length === 0) {
        // Carrito Expirado
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
  }

  // 6. Usuario eliminado lógicamente (soft delete) para auditar historial y churn
  const deletedEmail = 'usuario.eliminado@example.com';
  let deletedUser = await userRepo.findOne({ where: { email: deletedEmail }, withDeleted: true });
  if (!deletedUser) {
    deletedUser = await userRepo.save(
      userRepo.create({
        name: 'Usuario Baja Histórica',
        email: deletedEmail,
        passwordHash: defaultPasswordHash,
        deletedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // Eliminado hace 15 días
      }),
    );
  }
}

