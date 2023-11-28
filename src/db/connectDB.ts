import mongoose from 'mongoose'

export async function connectDB (URI: string): Promise<typeof mongoose> {
  return await mongoose.connect(URI)
}
