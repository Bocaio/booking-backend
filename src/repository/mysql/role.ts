import database from "../../config/database.js"
import { Role } from "../../types/index.js"

export interface IRoleRepository {
    getAll: () => Promise<Role[]>
    getById: (id: number) => Promise<Role | null>
}

class RoleRepository implements IRoleRepository {
    getAll = async (): Promise<Role[]> => {
        return database.selectFrom("roles").selectAll().orderBy("id", "asc").execute()
    }

    getById = async (id: number): Promise<Role | null> => {
        const role = await database
            .selectFrom("roles")
            .selectAll()
            .where("id", "=", id)
            .executeTakeFirst()
        return role ?? null
    }
}

export { RoleRepository }
