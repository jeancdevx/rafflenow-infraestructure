# Business Analysis - RaffleNow AWS Migration

## Objetivo

Este directorio contiene el análisis de negocio completo que justifica la migración de RaffleNow Perú SAC desde infraestructura legacy (VMs + RDS) hacia arquitectura serverless en AWS.

## Estructura

```
analysis/
├── data/                       # Datos de negocio (JSON)
│   ├── current_metrics.json   # Métricas sistema actual
│   ├── aws_metrics.json       # Métricas esperadas con AWS
│   └── projections.json       # Proyecciones 2 años
├── scripts/                    # Scripts Python
│   └── generate_charts.py     # Generador de gráficas
├── outputs/                    # Salidas generadas
│   └── charts/                # Gráficas PNG
├── requirements.txt           # Dependencias Python
└── README.md                  # Esta documentación
```

## Instalación

```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Instalar dependencias
pip install -r requirements.txt
```

## Uso

### Generar todas las gráficas

```bash
cd analysis/scripts
python generate_charts.py
```

Esto generará 6 gráficas en `analysis/outputs/charts/`:

1. **traffic_patterns.png** - Patrones de tráfico diario (días normal/promoción/viral)
2. **revenue_comparison.png** - Comparación de ingresos capturados vs perdidos
3. **lost_revenue_projection.png** - Proyección de pérdidas acumuladas (2 años)
4. **infrastructure_costs.png** - Comparación de costos (actual vs AWS)
5. **roi_projection.png** - ROI y break-even point
6. **scalability_comparison.png** - Error rate vs RPS

## Datos Clave

### Sistema Actual (Legacy)

- **Costo mensual:** S/ 43,000 (infraestructura + operaciones)
- **Ingresos capturados:** S/ 455,000/mes
- **Ingresos perdidos:** S/ 670,000/mes (60% pérdida)
- **Uptime:** 95% (438 horas downtime/año)
- **Capacidad máxima:** 50 RPS (falla en picos)
- **Error rate en picos:** 10-15%

### Sistema AWS (Propuesto)

- **Costo mensual:** S/ 13,120 (70% ahorro)
- **Ingresos capturados:** S/ 1,095,000/mes (141% incremento)
- **Ingresos perdidos:** S/ 30,000/mes (97% reducción)
- **Uptime:** 99.89% (9.6 horas downtime/año)
- **Capacidad máxima:** 1,000+ RPS (auto-scaling)
- **Error rate:** < 0.1%

### ROI

- **Inversión inicial:** S/ 75,000
- **Beneficio mensual:** S/ 669,880
- **Break-even:** 3 días
- **ROI primer año:** 10,598%

## Contexto de Negocio

### Problema Actual

RaffleNow Perú opera con infraestructura legacy que no escala:

- **Servidores sobredimensionados** para picos (desperdicio 75% del tiempo)
- **Downtime frecuente** en días virales (500 RPS de demanda vs 50 RPS de capacidad)
- **60% de participantes perdidos** por fallas técnicas
- **70% de tráfico fraudulento** (bots) sin protección
- **Equipo DevOps dedicado 24/7** a mantener infraestructura

### Solución Propuesta

Migración a AWS serverless:

- **Lambda + DynamoDB:** Auto-scaling automático (1,000+ concurrentes)
- **EventBridge + SQS:** Arquitectura event-driven con buffering
- **Cognito + WAF:** Autenticación robusta + protección contra bots (95% reducción fraude)
- **CloudFront + S3:** CDN global para assets optimizados
- **CloudWatch + X-Ray:** Observabilidad profesional

### Beneficios Medibles

| Métrica | Actual | AWS | Mejora |
|---------|--------|-----|--------|
| **Escalabilidad** | 50 RPS | 1,000+ RPS | 20x |
| **Disponibilidad** | 95% | 99.89% | 98% menos downtime |
| **Performance (p95)** | 8s | 500ms | 16x más rápido |
| **Error rate** | 10-15% | < 0.1% | 100x más confiable |
| **Fraude** | 70% | < 2% | 35x más seguro |
| **Costos** | S/ 43K | S/ 13.1K | 70% ahorro |

## Proyección 2 Años

**Sistema Actual (sin cambios):**
- Ingresos capturados: S/ 13.4M
- Ingresos perdidos: S/ 23.7M
- Tasa de captura: 36%

**Sistema AWS:**
- Ingresos capturados: S/ 36.3M
- Ingresos perdidos: S/ 0.8M
- Tasa de captura: 98%

**Beneficio total 2 años:** S/ 23.6M

## Uso en Presentación

Las gráficas generadas están optimizadas para:

- **Presentaciones ejecutivas** (PowerPoint/Google Slides)
- **Documentación técnica** (informes, propuestas)
- **Pitch a inversionistas**

Todas las gráficas son PNG de alta resolución (300 DPI) con colores profesionales y etiquetas claras.

## Notas Técnicas

- Los datos son **ficticios pero realistas** basados en benchmarks de industria
- Los costos AWS están calculados con la **calculadora oficial de AWS**
- Los SLAs citados son **garantías oficiales de AWS** (Lambda 99.95%, DynamoDB 99.99%, S3 99.9%)
- Las proyecciones asumen crecimiento orgánico del 15% anual

## Referencias

- [AWS Lambda Pricing](https://aws.amazon.com/lambda/pricing/)
- [DynamoDB Pricing](https://aws.amazon.com/dynamodb/pricing/)
- [Cognito Pricing](https://aws.amazon.com/cognito/pricing/)
- [AWS SLA Documents](https://aws.amazon.com/legal/service-level-agreements/)
