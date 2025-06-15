import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '../../../generated/prisma/index.js'
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

// Solución para __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedUsersMock = async () => {
    const filePath = path.join(__dirname, '../mock/mockUsers.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    const usersMock = JSON.parse(data);

    const usersCount = await prisma.user.count();
    if (usersCount > 0) {
        console.log('La tabla User ya tiene datos, no se realizará la siembra.');
        return false;
    }

    for (const user of usersMock) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        await prisma.user.create({
            data: {
                uuid: user.uuid,
                name: user.name,
                lastname: user.lastname,
                email: user.email,
                password: hashedPassword,
                role: user.role,
                isActive: user.isActive,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });
    }

    console.log('Datos de usuarios sembrados correctamente.');
    return true;
};

export { seedUsersMock };