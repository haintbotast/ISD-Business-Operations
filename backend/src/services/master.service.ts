import prisma from '../config/database';
import { AppError } from '../types';

// Derive the interactive-transaction client type from the prisma singleton (no extra @prisma/client import)
type PrismaTxClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export const masterService = {
  // ─── Categories ─────────────────────────────────────────────────────────────

  async listCategories(includeInactive = false) {
    return prisma.categoryMaster.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ mainGroup: 'asc' }, { sortOrder: 'asc' }, { category: 'asc' }],
    });
  },

  async createCategory(data: { mainGroup: string; category: string; sortOrder?: number }) {
    const exists = await prisma.categoryMaster.findUnique({
      where: { mainGroup_category: { mainGroup: data.mainGroup, category: data.category } },
    });
    if (exists) throw new AppError(409, 'CATEGORY_EXISTS', 'Category already exists in this group');

    return prisma.categoryMaster.create({
      data: {
        mainGroup: data.mainGroup,
        category: data.category,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  },

  async updateCategory(
    id: string,
    data: { mainGroup?: string; category?: string; isActive?: boolean; sortOrder?: number },
  ) {
    const cat = await prisma.categoryMaster.findUnique({ where: { id } });
    if (!cat) throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found');

    const newMainGroup = data.mainGroup ?? cat.mainGroup;
    const newCategory  = data.category  ?? cat.category;
    const isRename = newMainGroup !== cat.mainGroup || newCategory !== cat.category;

    if (isRename) {
      // Check collision on the new (mainGroup, category) pair
      const conflict = await prisma.categoryMaster.findUnique({
        where: { mainGroup_category: { mainGroup: newMainGroup, category: newCategory } },
      });
      if (conflict && conflict.id !== id) {
        throw new AppError(409, 'CATEGORY_EXISTS', 'Category already exists in this group');
      }

      // Atomic rename: update CategoryMaster + cascade to all non-deleted events
      return prisma.$transaction(async (tx: PrismaTxClient) => {
        const updated = await tx.categoryMaster.update({
          where: { id },
          data: {
            mainGroup: newMainGroup,
            category:  newCategory,
            ...(data.isActive  !== undefined && { isActive:  data.isActive }),
            ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
          },
        });
        await tx.event.updateMany({
          where: { mainGroup: cat.mainGroup, category: cat.category, deletedAt: null },
          data:  { mainGroup: newMainGroup,  category: newCategory },
        });
        return updated;
      });
    }

    // No rename — simple update (exclude name fields from payload)
    const { mainGroup: _mg, category: _cat, ...rest } = data;
    return prisma.categoryMaster.update({ where: { id }, data: rest });
  },

  // ─── Locations ──────────────────────────────────────────────────────────────

  async listLocations(includeInactive = false) {
    return prisma.locationMaster.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
    });
  },

  async createLocation(data: { code: string; fullName: string; sortOrder?: number }) {
    const exists = await prisma.locationMaster.findUnique({ where: { code: data.code } });
    if (exists) throw new AppError(409, 'LOCATION_EXISTS', `Location code "${data.code}" already exists`);

    return prisma.locationMaster.create({
      data: { code: data.code.toUpperCase(), fullName: data.fullName, sortOrder: data.sortOrder ?? 0 },
    });
  },

  async updateLocation(id: string, data: { fullName?: string; isActive?: boolean; sortOrder?: number }) {
    const loc = await prisma.locationMaster.findUnique({ where: { id } });
    if (!loc) throw new AppError(404, 'LOCATION_NOT_FOUND', 'Location not found');
    return prisma.locationMaster.update({ where: { id }, data });
  },

  // ─── System Components ───────────────────────────────────────────────────────

  async listSystemComponents(includeInactive = false) {
    return prisma.systemComponentMaster.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  },

  async createSystemComponent(data: { name: string; sortOrder?: number }) {
    const exists = await prisma.systemComponentMaster.findUnique({ where: { name: data.name } });
    if (exists) throw new AppError(409, 'COMPONENT_EXISTS', 'System component already exists');
    return prisma.systemComponentMaster.create({
      data: { name: data.name, sortOrder: data.sortOrder ?? 0 },
    });
  },

  async updateSystemComponent(id: string, data: { name?: string; isActive?: boolean; sortOrder?: number }) {
    const item = await prisma.systemComponentMaster.findUnique({ where: { id } });
    if (!item) throw new AppError(404, 'COMPONENT_NOT_FOUND', 'System component not found');
    if (data.name && data.name !== item.name) {
      const conflict = await prisma.systemComponentMaster.findUnique({ where: { name: data.name } });
      if (conflict) throw new AppError(409, 'COMPONENT_EXISTS', 'System component name already exists');
      // Cascade rename to events
      return prisma.$transaction(async (tx: PrismaTxClient) => {
        const updated = await tx.systemComponentMaster.update({ where: { id }, data });
        await tx.event.updateMany({
          where: { systemComponent: item.name, deletedAt: null },
          data: { systemComponent: data.name },
        });
        return updated;
      });
    }
    return prisma.systemComponentMaster.update({ where: { id }, data });
  },
};
