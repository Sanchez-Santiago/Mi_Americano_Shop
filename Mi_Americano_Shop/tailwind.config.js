// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{astro,js,ts,jsx,tsx,html}"],
  theme: {
    extend: {
      colors: {
        primario: "#FF008E",     // Azul fuerte
        secundario: "#D22779",   // Amarillo
        tercero: "#612897",      // Rojo
        cuarto: "#0C1E7F",       // Gris claro
      },
      backgroundImage: {
        radial: 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}