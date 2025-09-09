import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname, join } from 'path'
import fs from 'fs'

// Ensure uploads directory exists
const uploadsDir = join(process.cwd(), 'uploads')
try { fs.mkdirSync(uploadsDir, { recursive: true }) } catch {}

@Controller('/uploads')
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadsDir,
        filename: (_req: any, file: any, cb: any) => {
          const fn = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`
          cb(null, fn)
        },
      }),
    }),
  )
  upload(@UploadedFile() file: any) {
    const base = process.env.PUBLIC_API_URL || 'http://localhost:3001'
    return { url: `${base}/uploads/${file.filename}` }
  }
}
