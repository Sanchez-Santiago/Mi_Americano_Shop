export interface CardInterface {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  marca: string;
  talle: string;
  image: string;
  details?: string; // opcional: la API puede omitirlo
}
