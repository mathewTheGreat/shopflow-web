import { z } from "zod"

export const createStoreSchema = z.object({
    name: z.string().min(1, "Store name is required").max(100, "Store name must be less than 100 characters"),
    description: z.string().optional(),
})

export type CreateStoreInput = z.infer<typeof createStoreSchema>
