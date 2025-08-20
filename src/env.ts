/**
 * Purpose: Load and validate environment variables with zod. Do not log secrets.
 * Inputs: process.env
 * Outputs: typed, validated env object
 * Example: import {env} from './env'
 */
import 'dotenv/config'
import {z} from 'zod'

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  OPENAI_API_KEY: z.string().min(10).optional(),
  NOTION_TOKEN: z.string().optional(),
  NOTION_DATABASE_ID: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  FIGMA_TOKEN: z.string().optional(),
  PORT: z.string().optional(),
})

const parsed = EnvSchema.safeParse(process.env)
if(!parsed.success){
  // Only log shape, never values
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data

