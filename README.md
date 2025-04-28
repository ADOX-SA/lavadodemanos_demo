**Proyecto: Control de Lavado de Manos IA DEMO**

**Descripción**

Aplicación web que guía al usuario en un flujo paso a paso para realizar correctamente el lavado de manos. Utiliza la cámara del dispositivo y un modelo de inteligencia artificial (TensorFlow.js) para detectar la correcta ejecución de cada paso, midiendo la precisión y mostrando tiempos de conteo regresivo, promedios de score y animaciones de confeti al finalizar.

---

## Características

- **Detección en tiempo real:** Usa la cámara y un modelo AI para reconocer cada uno de los pasos de lavado.
- **Temporizador de validación:** Cada paso confirmado activa un temporizador de validación visual.
- **Conteo regresivo de inactividad:** Si no se detecta movimiento o manos, avisa y reinicia el paso.
- **Historial de promedios:** Al terminar muestra porcentaje promedio por paso y promedio general.
- **Animación de confeti:** Al completar todos los pasos.
- **Controles por teclado:**  
  • `Enter` reinicia el proceso cuando finaliza.  
  • `Barra espaciadora` o `Espacio` salta el paso actual y te lleva al siguiente.

---

## Tecnologías

- **Framework:** Next.js (TSX)  
- **Lenguaje:** TypeScript, React  
- **Modelado AI:** TensorFlow.js (`@tensorflow/tfjs`)  
- **Webcam:** `react-webcam`, clase personalizada `Webcam`  
- **Animaciones:** `canvas-confetti`  
- **Estilos:** Tailwind CSS, CSS Modules

---

## Requisitos Previos

- Node.js (>= 18)  
- Yarn (>= 1.22)

---

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/<usuario>/lavadodemanos_demo.git
cd lavadodemanos_demo

# Instalar dependencias
yarn install
```  

---

## Uso

```bash
# Modo desarrollo
yarn dev
```  
Abre tu navegador en `http://localhost:3000`.

---

## Estructura del Proyecto

```
├── public/               # Recursos estáticos (videos de pasos, logos)
├── src/
│   ├── components/       # Componentes reutilizables (Loader, IconSteps, etc.)
│   ├── hooks/            # Custom hooks (useTimer, useCountdown)
│   ├── context/          # Contexto para modelo AI
│   ├── utils/            # Funciones utilitarias (webcam, detect, labels.json)
│   ├── style/            # CSS Modules
│   └── app/              # Página principal (Home.tsx)
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## Cómo Funciona

1. **Carga del modelo:** Al abrir la app, se descarga y carga el modelo AI. Tarda unos minutos dependiendo de la conexiòn de internet.
2. **Selección de paso:** Se muestra un video instructivo de cada paso.  
3. **Detección y validación:** Cuando la IA detecta el paso actual con un score por encima de un umbral, inicia un temporizador de validación.  
4. **Acumulación de scores:** Se acumulan scores por frame y se calcula el promedio al finalizar cada paso.  
5. **Inactividad:** Si no hay detección, se inicia un conteo regresivo para reiniciar todo el proceso de lavado de manos.  
6. **Finalización:** Al completar todos los pasos, muestra promedios y confeti, y reinicia tras un countdown.

---

## Scripts Disponibles

- `yarn dev`: Levanta servidor en modo desarrollo en `localhost:3000`.  
- `yarn build`: Compila la app para producción.  
- `yarn start`: Inicia la app en modo producción.  
- `yarn lint`: Corre ESLint.

---

## Licencia

ADOX © 2025

