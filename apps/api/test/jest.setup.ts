import path from 'path'
import dotenv from 'dotenv'

// Load env from package directory
dotenv.config({ path: path.join(__dirname, '..', '.env') })
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') })

jest.setTimeout(30000)
