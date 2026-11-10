import { notFound } from 'next/navigation';

// Cualquier ruta desconocida muestra el 404 de la marca (con header, carrito y pie)
export default function CatchAll() {
  notFound();
}
