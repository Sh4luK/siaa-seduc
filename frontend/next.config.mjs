/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ['172.0.0.1'],
};


export default nextConfig;

// // import { fileURLToPath } from 'url';
// // import path from 'path';

// // const __filename = fileURLToPath(import.meta.url);
// // const __dirname = path.dirname(__filename);

// // /** @type {import('next').NextConfig} */
// // const nextConfig = {
// //   /* config options here */
// //   reactCompiler: true,
// //   allowedDevOrigins: ['172.0.0.1'],
  
// //   turbopack: {
// //     // Agora o __dirname simulado vai funcionar perfeitamente
// //     root: __dirname, 
// //   },
// // };

// // export default nextConfig;



// import { fileURLToPath } from 'url';
// import path from 'path';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   /* config options here */
//   reactCompiler: true,
//   allowedDevOrigins: ['172.0.0.1'],
  
//   // Evita recargas desnecessárias guardando em cache as requisições dos Server Components
//   experimental: {
//     serverComponentsHmrCache: true,
//   },
  
//   turbopack: {
//     root: __dirname, 
//   },
// };

// export default nextConfig;
