import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import fs from "fs"
import path from "path"
import * as dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "../.env.local") })

const pgAdapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter: pgAdapter })

function parseOptions(options: string[], correctAnswer: string) {
  const correctKey = correctAnswer.trim()[0].toUpperCase()
  return options.map((opt: string) => ({
    key: opt.trim()[0].toUpperCase(),
    text: opt.replace(/^[A-D]\)\s*/, "").trim(),
    isCorrect: opt.trim()[0].toUpperCase() === correctKey,
  }))
}

async function main() {
  const dataDir = path.join(__dirname, "../../data/consolidated")
  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".json"))

  const sections = new Map<string, string>()
  const allTags = new Map<string, string>()

  for (const file of files) {
    const questions = JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf-8"))
    for (const q of questions) {
      sections.set(q.section_number, q.section)
      for (const slug of q.tags ?? []) {
        if (!allTags.has(slug)) {
          allTags.set(
            slug,
            slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
          )
        }
      }
    }
  }

  for (const [id, name] of sections) {
    await prisma.section.upsert({ where: { id }, create: { id, name }, update: {} })
  }
  console.log(`Sections: ${sections.size}`)

  for (const [slug, label] of allTags) {
    await prisma.tag.upsert({ where: { slug }, create: { slug, label }, update: {} })
  }
  console.log(`Tags: ${allTags.size}`)

  let imported = 0

  for (const file of files) {
    const questions = JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf-8"))

    for (const q of questions) {
      const tagRecords = await prisma.tag.findMany({
        where: { slug: { in: q.tags ?? [] } },
        select: { id: true },
      })

      await prisma.question.upsert({
        where: { id: q.question_id },
        create: {
          id: q.question_id,
          questionText: q.question_text,
          rationale: q.rationale,
          pageReference: q.page_reference ?? null,
          sectionId: q.section_number,
          options: parseOptions(q.options, q.correct_answer),
          sourceFile: file,
          tags: {
            create: tagRecords.map((t) => ({ tagId: t.id })),
          },
        },
        update: {},
      })
      imported++
    }
  }

  console.log(`Done — imported: ${imported}`)
}

main().finally(() => prisma.$disconnect())
