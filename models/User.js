import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  correo: {
    type: String,
    required: [true, 'El correo es obligatorio'],
    unique: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Correo inválido']
  },
  edad: {
    type: Number,
    required: [true, 'La edad es obligatoria'],
    min: [1, 'La edad debe ser mayor a 0'],
    max: [120, 'Edad no válida']
  },
  imagenPerfil: {
    type: String,
    required: [true, 'La imagen de perfil es obligatoria']
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);