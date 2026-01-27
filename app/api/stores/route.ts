import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createStoreSchema } from "@/lib/validators/store"

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const body = await req.json()
        const { name, description } = createStoreSchema.parse(body)

        // TODO: Database insertion logic here
        // For now, we just mock the response
        const newStore = {
            id: crypto.randomUUID(),
            name,
            description,
            userId,
            createdAt: new Date().toISOString(),
        }

        console.log("Creating store:", newStore)

        return NextResponse.json(newStore)
    } catch (error: any) {
        console.error("[STORES_POST]", error)
        if (error.name === "ZodError") {
            return new NextResponse("Invalid request data", { status: 400 })
        }
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
