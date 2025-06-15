import express from 'express';
import morgan from 'morgan';
import { config } from 'dotenv';

import authRouter from './src/routers/authRouter.js';
import globalErrorMiddleware from './src/middleware/globalErrorMiddleware.js';

/*Configuracion de dotenv para poder acceder a las variables de entorno.*/
config({path:'.env'});
const PORT = process.env.PORT;
const environment = process.env.NODE_ENV;

/*Configuracion de express para el funcionamiento de la API.*/
/*Se añade morgan para visualizar el uso de la API y .json para transformar todo a JSON*/
const app = express();
app.use(express.json());
app.use(morgan('dev'));

app.use("/auth", authRouter);

/*Ruta base*/
app.get('/', (req, res) => {
    res.status(200).send("OK");
});

app.use(globalErrorMiddleware);

/*Configuracion de la API para que escuche en el puerto correspondiente y se le asigna el entorno.
Esto ademas sirve para ver el estado de la API en la consola.*/
app.listen(PORT,()=> {
    console.log(`Entorno: ${environment}`);
    console.log(`Puerto: ${PORT}`);
    console.log(`URL: http://localhost:${PORT}`);
});