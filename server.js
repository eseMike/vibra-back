import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/vibraDB')
  .then(() => console.log('💜 MongoDB conectado en vibraDB'))
  .catch(err => console.log('❌ Error en MongoDB:', err));

// Ruta de prueba temporal
app.get('/', (req, res) => {
  res.json({ message: 'Servidor backend Vibra activo 🚀' });
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Inicializar servidor
app.listen(PORT, () => {
  console.log(`🔥 Servidor corriendo en http://localhost:${PORT}`);
});
