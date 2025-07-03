import { PrismaClient } from "../../generated/prisma/index.js";
import dotenv from "dotenv";
import { generateTokenJWT, verifyTokenJWT } from "../utils/tokenGenerator.js";
import bcrypt from "bcryptjs";

dotenv.config();

const prisma = new PrismaClient();

const authCheck = (req, res) => {
    res.status(200).send("OK Auth Check");
}

const login = async (req, res) => {
    const { email, password } = req.body;
    if(!email || !password) {
        return res.status(400).json({ message: "Email y contraseña son requeridos" });
    }
    
    if(email === undefined || password === undefined) {
        return res.status(400).json({ message: "Email y contraseña son requeridos" });
    }

    try {
        const user = await prisma.user.findFirst({
        where: {
            email: email,
        },
    });

       if (!user) {
        return res.status(401).json({ message: "Alguno de los campos es incorrecto." });
        }
        if(user.isActive === false) {
            return res.status(403).json({ message: "Usuario inactivo. Contacte al administrador." });
        }

        const isMatch = await bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Alguno de los campos es incorrecto." });
        }

        const userForToken = {
            uuid: user.uuid,
            name: user.name,
            lastname: user.lastname,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }

        const token = generateTokenJWT(userForToken);
        res.status(200).json({ user: userForToken, token: token });

    } catch (error) {
        console.error("Error en el inicio de sesión:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

const updatePassword = async (req, res) => {
    const { current_password, new_password, password_confirmation } = req.body;
    const { uuid } = req.params;
    console.log("UUID recibido:", uuid);
    const token = req.headers.authorization;
    
    if (!token) {
        return res.status(401).json({ message: "No se ha proporcionado un token de autenticación." });
    }

    const decodedToken = verifyTokenJWT(token);
    if (!decodedToken) {
        return res.status(401).json({ message: "Token inválido" });
    }

    if(decodedToken.user.uuid !== uuid) {
        if(decodedToken.user.role !== "Administrador") {
            return res.status(403).json({ message: "No tiene permiso para actualizar la contraseña de este usuario." });
        }
        else{
            console.log("El usuario es un administrador, se permite la actualización de contraseña.");
        }
    }

    if (!current_password || !new_password || !password_confirmation) {
        return res.status(400).json({ message: "Faltan campos requeridos." });
    }
    if (current_password === undefined || new_password === undefined || password_confirmation === undefined) {
        return res.status(400).json({ message: "Faltan campos requeridos." });
    }

    const user = await prisma.user.findFirst({
        where: {
            uuid: uuid,
        },
    });

    if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado." });
    }
    if(user.isActive === false) {
        return res.status(403).json({ message: "Usuario inactivo. Contacte al administrador." });
    }
    const isMatch = await bcrypt.compareSync(current_password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: "Contraseña actual incorrecta." });
    }

    if (new_password !== password_confirmation) {
        return res.status(400).json({ message: "Las contraseñas no coinciden." });
    }

    if(current_password === new_password) {
        return res.status(401).json({ message: "La nueva contraseña no puede ser igual a la actual." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);
    const updatedUser = await prisma.user.update({
        where: { uuid: uuid },
        data: {
            password: hashedPassword,
            updatedAt: new Date(),
        },
    });

    if (!updatedUser) {
        return res.status(500).json({ message: "Error al actualizar la contraseña." });
    }

    res.status(200).json({ message: "Contraseña actualizada correctamente." });
};

const logout = (req, res) => {
    res.status(200).json({ message: "Sesión cerrada correctamente." });
};

const syncUserCreation = async (req, res) => {
    const { uuid, name, lastname, email, password, role } = req.body;
    if (!uuid || !name || !lastname || !email || !password || !role) {
        return res.status(400).json({ message: "Todos los campos son requeridos." });
    }
    if (uuid === undefined || name === undefined || lastname === undefined || email === undefined || password === undefined || role === undefined) {
        return res.status(400).json({ message: "Todos los campos son requeridos." });
    }

    try {
        const existingUser = await prisma.user.findFirst({
            where: { email: email },
        });

        if (existingUser) {
            return res.status(409).json({ message: "El usuario ya existe." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await prisma.user.create({
            data: {
                uuid: uuid,
                name: name,
                lastname: lastname,
                email: email,
                password: hashedPassword,
                role: role,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });

        res.status(201).json({ message: "Usuario creado correctamente.", user: newUser });
    } catch (error) {
        console.error("Error al crear el usuario:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
}

const syncPasswordUpdate = async (req, res) => {
    const { uuid, new_password } = req.body;
    if (!uuid || !new_password) {
        return res.status(400).json({ message: "UUID y nueva contraseña son requeridos." });
    }
    if (uuid === undefined || new_password === undefined) {
        return res.status(400).json({ message: "UUID y nueva contraseña son requeridos." });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { uuid: uuid },
        });

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(new_password, salt);

        const updatedUser = await prisma.user.update({
            where: { uuid: uuid },
            data: {
                password: hashedPassword,
                updatedAt: new Date(),
            },
        });

        res.status(200).json({ message: "Contraseña actualizada correctamente.", user: updatedUser });
    } catch (error) {
        console.error("Error al actualizar la contraseña:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
}
export { authCheck, login, updatePassword, logout, syncUserCreation, syncPasswordUpdate };