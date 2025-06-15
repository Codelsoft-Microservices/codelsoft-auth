import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from 'uuid';
dotenv.config();

export const generateTokenJWT = (user) => {
    // Convertir cualquier BigInt a String antes de firmar el token
    const userData = JSON.parse(JSON.stringify(user, (key, value) => {
        if (typeof value === 'bigint') {
            return value.toString(); // Convertir BigInt a String
        }
        return value;
    }));

    const token = jwt.sign(
        { user: userData },
        process.env.JWT_SECRET,
        {
            expiresIn: '60d',
            algorithm: process.env.ALG_TOKEN,
            issuer: 'CODELSOFT-API',
            audience: 'CODELSOFT-CLIENT',
            jwtid: uuidv4(), // Generar un UUID único para el token
        }
    );
    return token;
}

export const verifyTokenJWT = (token) => {
    try {
        // Eliminar el prefijo 'Bearer ' si está presente
        if (token.startsWith("Bearer ")) {
            token = token.slice(7).trim();
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: [process.env.ALG_TOKEN] });
        return decoded;
    } catch (error) {
        console.error("Error al verificar el token:", error.message);
        return null; // Retornar null si el token no es válido
    }
};