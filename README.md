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
