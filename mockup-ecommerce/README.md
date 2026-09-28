# Template ecommerce PopoWash

Template estático y responsive para revisar cuatro arquitecturas de ecommerce de un solo producto.

## Punto de entrada

Abre [`index.html`](index.html). El selector superior permite navegar entre todas las propuestas:

| Archivo | Enfoque |
|---|---|
| `index.html` | Marca y deseo |
| `opcion-2.html` | Confianza y compatibilidad |
| `opcion-3.html` | Impacto y conversión |
| `opcion-4.html` | Compra y arquitectura transaccional |
| `opcion-5.html` | Variación de impacto |
| `estrategia.html` | Justificación y comparación |

La **Opción 04** es la arquitectura recomendada para avanzar hacia el ecommerce definitivo. Su botón **Ver lógica** muestra por qué aparece cada bloque en esa posición. La **Opción 05** conserva la variante de impacto como propuesta adicional dentro del mismo selector.

## Vista local

Desde la raíz del repositorio:

```powershell
python -m http.server 8765
```

Luego abre:

```text
http://localhost:8765/mockup-ecommerce/
```

No requiere compilación ni instalación de dependencias.

## Publicación con GitHub Pages

El directorio completo debe mantenerse unido porque las páginas comparten `review.css` y enlaces relativos. Para una revisión en GitHub Pages, la URL de entrada será:

```text
https://<usuario>.github.io/<repositorio>/mockup-ecommerce/
```

## Datos que deben reemplazarse antes de vender

- Precio definitivo.
- Fotografías y video del producto real.
- Compatibilidad, medidas y conexiones confirmadas.
- Contenido exacto de la caja.
- Pasarela y medios de pago habilitados.
- Costos y plazos de despacho.
- Garantía, cambios y devoluciones.
- Canal y horario de soporte.
- Reseñas verificadas de clientes o pruebas piloto.

Los valores actuales están identificados como referenciales o pendientes. La bolsa, el cálculo de despacho y el comprobador de compatibilidad son demostraciones y no procesan compras.

## Estructura recomendada

La Opción 04 ordena la decisión de compra así:

1. Producto, beneficio, precio y compra.
2. Compatibilidad, despacho, garantía y pagos.
3. Señales de confianza.
4. Reseñas verificadas.
5. Comprobador de compatibilidad.
6. Características y funcionamiento.
7. Instalación.
8. Contenido de la caja y preguntas frecuentes.
9. Segundo llamado a comprar.
