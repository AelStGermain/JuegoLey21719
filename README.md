# AelCase

AelCase es un videojuego educativo sobre privacidad y protección de datos en el trabajo. La experiencia ocurre dentro de AelOS, un escritorio ficticio donde correos, conversaciones, planillas y alertas se convierten en casos que el jugador debe investigar.

Quise llevar estos temas a situaciones reconocibles y decisiones concretas. En vez de presentar la normativa como una lista para memorizar, AelCase invita a observar, relacionar evidencias y actuar.

## Casos actuales

La versión actual contiene tres escenarios y conserva sus identificadores originales:

- **Caso 1 — Selección de personal:** revisar un correo y una planilla con información excesiva antes de responder.
- **Caso 2 — Comunicación y acceso:** investigar datos personales compartidos en un chat corporativo y detectar accesos que ya no corresponden.
- **Caso 4 — El correo equivocado:** corregir destinatarios, visibilidad y adjuntos antes de que termine la cuenta regresiva de un envío programado.

AelScan acompaña la investigación y permite documentar los hallazgos relacionándolos con los pilares aplicables de la Ley 21.719.

## Cómo está construido

- React y TypeScript.
- Vite para desarrollo y compilación.
- Framer Motion para las transiciones e interacciones.
- Vitest para las pruebas automatizadas.
- Una interfaz ilustrada inspirada en software de escritorio, cómic y videojuegos independientes.

El juego funciona completamente en el navegador. No utiliza backend ni transmite información del jugador. El progreso se conserva localmente bajo la clave `aelos_game_state`.

## Ejecutar localmente

Necesitas Node.js compatible con Vite 8 y npm.

```bash
npm install
npm run dev
```

Vite mostrará la dirección local desde la que puedes abrir el juego.

## Verificar el proyecto

```bash
npm test
npm run lint
npm run build
```

La compilación de producción queda en `dist/`. Para desplegar con Cloudflare Pages se utiliza `npm run build` como comando de compilación y `dist` como directorio de salida.

La documentación de arquitectura, diseño de juego, experiencia de usuario y alcance legal se encuentra en [`docs/`](docs/).

## Autoría

Diseñado y desarrollado por **Sofía Gómez — AelStGermain**.

- [GitHub](https://github.com/AelStGermain)
- [Portafolio](https://aelstgermain.github.io/Aelita/)

## Uso y derechos

Copyright © 2026 AelStGermain. Todos los derechos reservados.

Este repositorio se publica con fines de demostración, evaluación y portafolio. No se concede autorización para copiar, modificar, distribuir o explotar comercialmente sus elementos originales sin autorización previa y escrita del titular. Consulta [LICENSE](LICENSE) para conocer las condiciones de uso.

Las bibliotecas y dependencias de terceros conservan sus respectivas licencias.
