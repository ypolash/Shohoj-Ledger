import { prisma } from "@/lib/prisma";
import { permissionCache } from "./permissionCache";
import { DefaultPermissions } from "./defaultPermissions";

/**
 * Service to manage Roles and Permissions centrally without frontend UI.
 */
export class RbacService {
  /**
   * Run once during deployment to sync database permissions with DefaultPermissions list.
   */
  static async seedPermissions() {
    for (const p of DefaultPermissions) {
      await prisma.permission.upsert({
        where: { action: p.action },
        update: { moduleKey: p.moduleKey },
        create: { action: p.action, moduleKey: p.moduleKey }
      });
    }
  }

  /**
   * Retrieves all permissions currently attached to a user's role.
   * Leverages caching for speed.
   */
  static async getRolePermissions(roleId: string): Promise<Set<string>> {
    // 1. Check Cache
    const cached = permissionCache.get(roleId);
    if (cached) return cached;

    // 2. Fetch from DB
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true }
    });

    const actions = rolePermissions.map(rp => rp.permission.action);

    // 3. Cache and return
    permissionCache.set(roleId, actions);
    return new Set(actions);
  }

  /**
   * Creates a new Role for a specific company.
   */
  static async createRole(companyId: string, name: string) {
    return await prisma.role.create({
      data: { companyId, name, isDefault: false }
    });
  }

  /**
   * Updates a Role's name.
   */
  static async updateRole(roleId: string, name: string) {
    return await prisma.role.update({
      where: { id: roleId },
      data: { name }
    });
  }

  /**
   * Deletes a custom Role (cannot delete default roles).
   */
  static async deleteRole(roleId: string) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (role?.isDefault) {
      throw new Error("Cannot delete a default role.");
    }
    return await prisma.role.delete({ where: { id: roleId } });
  }

  /**
   * Assigns an array of permission actions to a role.
   */
  static async assignPermissions(roleId: string, actions: string[]) {
    // 1. Fetch matching permission IDs
    const permissions = await prisma.permission.findMany({
      where: { action: { in: actions } }
    });

    // 2. Clear old permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId }
    });

    // 3. Insert new
    await prisma.rolePermission.createMany({
      data: permissions.map(p => ({
        roleId,
        permissionId: p.id
      }))
    });

    // 4. Invalidate Cache
    permissionCache.invalidate(roleId);

    return true;
  }

  /**
   * Lists all available platform permissions.
   */
  static async listPermissions() {
    return await prisma.permission.findMany();
  }

  /**
   * Lists all roles for a specific company.
   */
  static async listRoles(companyId: string) {
    return await prisma.role.findMany({
      where: { companyId }
    });
  }
}
