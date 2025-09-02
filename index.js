import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import multer from 'multer';
import cors from 'cors';
import User from './models/User.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Para servir imágenes estáticamente

// Configurar Multer para guardar imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ storage });

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('MongoDB conectado'))
  .catch(err => console.error('Error al conectar MongoDB:', err));

// Ruta para registrar usuarios
app.post('/api/registro', upload.single('imagenPerfil'), async (req, res) => {
  try {
    const { nombre, correo, edad } = req.body;
    const imagenPerfil = req.file ? req.file.path : null;

    if (!imagenPerfil) {
      return res.status(400).json({ error: 'Debes subir una imagen de perfil' });
    }

    const nuevoUsuario = new User({ nombre, correo, edad, imagenPerfil });
    await nuevoUsuario.save();

    res.status(201).json({ mensaje: 'Usuario registrado con éxito', usuario: nuevoUsuario });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }
    res.status(400).json({ error: error.message });
  }
});

// Ruta para obtener todos los usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const usuarios = await User.find().select('-__v');
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});