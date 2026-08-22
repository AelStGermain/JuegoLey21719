# AelCase

AelCase es un simulador frontend de decisiones de privacidad inspirado en situaciones laborales. Presenta tres casos interactivos dentro de un escritorio ficticio y permite contrastar evidencias con principios de la Ley 21.719.

## Desarrollo

Requisitos: Node.js compatible con Vite 8 y npm.

```bash
npm install
npm run dev
```

## Verificación

```bash
npm test
npm run lint
npm run build
```

El estado de progreso se guarda localmente en el navegador bajo la clave `aelos_game_state`. No existe backend ni se transmiten datos del jugador.

La documentación de arquitectura, diseño de juego, UX y alcance legal se encuentra en [`docs/`](docs/).

## Derechos de autor

Copyright © 2026 AelStGermain. Todos los derechos reservados.

Este proyecto es software propietario publicado con fines de demostración, evaluación y portafolio. No se concede autorización para copiar, modificar, distribuir ni explotar comercialmente sus elementos originales sin autorización previa y escrita del titular. Consulta [LICENSE](LICENSE) para conocer las condiciones de uso.

Los componentes y dependencias de terceros conservan sus respectivas licencias.
