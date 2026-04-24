import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import contentRoutes from './routes/content.js';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Middleware para verificar token
const verifyToken = (req, res, next) => {
   const authHeader = req.headers['authorization'];

   if (!authHeader) {
      return res.status(401).json({message: 'No token provided'});
   }

   const token = authHeader.split(' ')[1];

   if (!token) {
      return res.status(401).json({message: 'Invalid token format'});
   }

   try {
      const decoded = jwt.verify(token, 'secreto_super_seguro');
      req.user = decoded;
      next();
   } catch (error) {
      return res.status(401).json({message: 'Invalid token'});
   }
};

// Conexión a MongoDB
mongoose
   .connect('mongodb://localhost:27017/vibraDB')
   .then(() => console.log('💜 MongoDB conectado en vibraDB'))
   .catch((err) => console.log('❌ Error en MongoDB:', err));

// Ruta de prueba temporal
app.get('/', (req, res) => {
   res.json({message: 'Servidor backend Vibra activo 🚀'});
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);

// Ruta protegida de prueba
app.get('/api/protected', verifyToken, (req, res) => {
   res.json({
      message: 'Acceso autorizado 🔐',
      user: req.user,
   });
});

// Inicializar servidor
app.listen(PORT, () => {
   console.log(`🔥 Servidor corriendo en http://localhost:${PORT}`);
});
