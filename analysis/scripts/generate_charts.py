"""
Business Analysis Charts Generator
Genera gráficas profesionales para justificar la migración a AWS.
"""

import json
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from pathlib import Path

# Configuración de estilo
sns.set_theme(style="whitegrid")
plt.rcParams['figure.figsize'] = (12, 8)
plt.rcParams['font.size'] = 10
plt.rcParams['axes.labelsize'] = 12
plt.rcParams['axes.titlesize'] = 14
plt.rcParams['legend.fontsize'] = 10

# Directorios
DATA_DIR = Path(__file__).parent.parent / 'data'
OUTPUT_DIR = Path(__file__).parent.parent / 'outputs' / 'charts'
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def load_data():
    """Cargar datos desde archivos JSON"""
    with open(DATA_DIR / 'current_metrics.json', 'r', encoding='utf-8') as f:
        current = json.load(f)
    
    with open(DATA_DIR / 'aws_metrics.json', 'r', encoding='utf-8') as f:
        aws = json.load(f)
    
    with open(DATA_DIR / 'projections.json', 'r', encoding='utf-8') as f:
        projections = json.load(f)
    
    return current, aws, projections


def generate_traffic_patterns(current):
    """
    Gráfica 1: Patrones de tráfico diario
    Muestra RPS en diferentes escenarios a lo largo del día
    """
    fig, ax = plt.subplots(figsize=(14, 8))
    
    # Horas del día
    hours = np.arange(0, 24)
    
    # Simular patrones de tráfico
    # Día normal: pico a las 22-23h
    normal = np.array([0.1, 0.05, 0.05, 0.05, 0.05, 0.1, 0.3, 0.5, 0.7, 0.8,
                       0.9, 1.0, 1.2, 1.0, 0.9, 0.8, 0.9, 1.1, 1.3, 1.5,
                       1.7, 1.9, 2.0, 1.8])
    
    # Día promoción: picos al mediodía y noche
    promotion = np.array([0.5, 0.3, 0.2, 0.2, 0.3, 0.8, 2.0, 5.0, 10.0, 15.0,
                          20.0, 35.0, 50.0, 40.0, 30.0, 25.0, 28.0, 32.0, 38.0, 42.0,
                          45.0, 48.0, 50.0, 45.0])
    
    # Día viral: tráfico sostenido alto
    viral = np.array([5.0, 3.0, 2.0, 2.0, 3.0, 10.0, 50.0, 150.0, 300.0, 400.0,
                      450.0, 480.0, 500.0, 490.0, 470.0, 450.0, 460.0, 475.0, 485.0, 495.0,
                      500.0, 500.0, 500.0, 480.0])
    
    # Plotear líneas
    ax.plot(hours, normal, marker='o', linewidth=2, color='#2196F3', label='Día Normal (2 RPS pico)')
    ax.plot(hours, promotion, marker='s', linewidth=2, color='#FF9800', label='Día Promoción (50 RPS pico)')
    ax.plot(hours, viral, marker='^', linewidth=2, color='#F44336', label='Día Viral (500 RPS pico)')
    
    # Área crítica (22:00-23:59)
    ax.axvspan(22, 24, alpha=0.2, color='red', label='Pico crítico (22:00-23:59)')
    
    # Línea de capacidad actual
    ax.axhline(y=50, color='black', linestyle='--', linewidth=2, label='Capacidad máxima actual (50 RPS)')
    
    ax.set_xlabel('Hora del día', fontweight='bold')
    ax.set_ylabel('Requests por segundo (RPS)', fontweight='bold')
    ax.set_title('Patrones de Tráfico: Sistema Actual vs Demanda Real', fontweight='bold', pad=20)
    ax.set_xticks(hours)
    ax.set_xticklabels([f'{h:02d}:00' for h in hours], rotation=45, ha='right')
    ax.legend(loc='upper left', framealpha=0.9)
    ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'traffic_patterns.png', dpi=300, bbox_inches='tight')
    print(f"✓ Generado: traffic_patterns.png")
    plt.close()


def generate_revenue_comparison(current, aws):
    """
    Gráfica 2: Comparación de ingresos
    Bar chart mostrando ingreso capturado vs perdido
    """
    fig, ax = plt.subplots(figsize=(14, 8))
    
    scenarios = ['Día Normal', 'Día Promoción', 'Día Viral', 'Mensual']
    
    # Datos actuales (en miles de soles)
    current_captured = [5.4, 50, 270, 455]
    current_lost = [0.6, 75, 630, 670]
    
    # Datos AWS (en miles de soles)
    aws_captured = [5.94, 122.5, 882, 1095]
    aws_lost = [0.06, 2.5, 18, 30]
    
    x = np.arange(len(scenarios))
    width = 0.35
    
    # Bars
    bars1 = ax.bar(x - width/2, current_captured, width, label='Sistema Actual - Capturado',
                   color='#4CAF50', alpha=0.8)
    bars2 = ax.bar(x - width/2, current_lost, width, bottom=current_captured,
                   label='Sistema Actual - Perdido', color='#F44336', alpha=0.8)
    
    bars3 = ax.bar(x + width/2, aws_captured, width, label='Con AWS - Capturado',
                   color='#2196F3', alpha=0.8)
    bars4 = ax.bar(x + width/2, aws_lost, width, bottom=aws_captured,
                   label='Con AWS - Perdido', color='#FF9800', alpha=0.8)
    
    # Etiquetas
    ax.set_xlabel('Escenario', fontweight='bold')
    ax.set_ylabel('Ingresos (Miles de Soles)', fontweight='bold')
    ax.set_title('Comparación de Ingresos: Sistema Actual vs AWS', fontweight='bold', pad=20)
    ax.set_xticks(x)
    ax.set_xticklabels(scenarios)
    ax.legend(loc='upper left', framealpha=0.9)
    ax.grid(True, axis='y', alpha=0.3)
    
    # Añadir valores en las barras
    for bars in [bars1, bars3]:
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height/2,
                   f'S/ {height:.0f}K',
                   ha='center', va='center', fontweight='bold', color='white')
    
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'revenue_comparison.png', dpi=300, bbox_inches='tight')
    print(f"✓ Generado: revenue_comparison.png")
    plt.close()


def generate_lost_revenue_projection(projections):
    """
    Gráfica 3: Pérdidas acumuladas (2 años)
    Line chart mostrando pérdidas mes a mes
    """
    fig, ax = plt.subplots(figsize=(14, 8))
    
    months = np.arange(0, 25)
    
    # Pérdidas acumuladas sistema actual (en millones de soles)
    current_losses = []
    cumulative = 0
    monthly_loss = 0.670  # S/ 670K por mes
    
    for month in months:
        current_losses.append(cumulative)
        # Incremento de pérdidas debido a crecimiento
        if month <= 12:
            cumulative += monthly_loss * (1 + 0.15 * (month / 12))
        else:
            cumulative += monthly_loss * 1.15 * (1 + 0.15 * ((month - 12) / 12))
    
    # Pérdidas acumuladas con AWS (mínimas)
    aws_losses = []
    cumulative_aws = 0
    monthly_loss_aws = 0.030  # S/ 30K por mes (2% residual)
    
    for month in months:
        aws_losses.append(cumulative_aws)
        cumulative_aws += monthly_loss_aws
    
    # Plotear
    ax.plot(months, current_losses, marker='o', linewidth=3, color='#F44336',
           label='Sistema Actual (Legacy)', markersize=6)
    ax.plot(months, aws_losses, marker='s', linewidth=3, color='#2196F3',
           label='Con AWS (Serverless)', markersize=6)
    
    # Área entre curvas
    ax.fill_between(months, current_losses, aws_losses, alpha=0.3, color='green',
                    label='Ahorro con AWS')
    
    # Anotaciones clave
    ax.annotate(f'Pérdida 2 años: S/ {current_losses[-1]:.1f}M',
               xy=(24, current_losses[-1]), xytext=(20, current_losses[-1] + 2),
               arrowprops=dict(arrowstyle='->', color='red', lw=2),
               fontsize=11, fontweight='bold', color='red')
    
    ax.annotate(f'Pérdida 2 años: S/ {aws_losses[-1]:.1f}M',
               xy=(24, aws_losses[-1]), xytext=(20, 2),
               arrowprops=dict(arrowstyle='->', color='blue', lw=2),
               fontsize=11, fontweight='bold', color='blue')
    
    ax.set_xlabel('Meses desde implementación', fontweight='bold')
    ax.set_ylabel('Pérdidas acumuladas (Millones de Soles)', fontweight='bold')
    ax.set_title('Proyección de Pérdidas Acumuladas: Sistema Actual vs AWS (2 años)',
                fontweight='bold', pad=20)
    ax.legend(loc='upper left', framealpha=0.9, fontsize=12)
    ax.grid(True, alpha=0.3)
    ax.set_xlim(0, 24)
    
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'lost_revenue_projection.png', dpi=300, bbox_inches='tight')
    print(f"✓ Generado: lost_revenue_projection.png")
    plt.close()


def generate_infrastructure_costs(current, aws):
    """
    Gráfica 4: Costos de infraestructura
    Pie charts comparando costos actuales vs AWS
    """
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 8))
    
    # Sistema actual
    current_labels = ['Servidores\n(EC2+RDS+Cache)\nS/ 13.5K',
                     'Networking\n(ALB+Transfer)\nS/ 2.1K',
                     'Storage\nS/ 0.8K',
                     'Observability\nS/ 0.4K',
                     'DevOps Team\nS/ 26.2K']
    current_sizes = [13500, 2100, 800, 400, 26200]
    current_colors = ['#F44336', '#FF9800', '#FFC107', '#4CAF50', '#2196F3']
    
    wedges1, texts1, autotexts1 = ax1.pie(current_sizes, labels=current_labels,
                                           autopct='%1.1f%%', startangle=90,
                                           colors=current_colors, textprops={'fontsize': 10})
    ax1.set_title('Sistema Actual\nTotal: S/ 43,000/mes',
                 fontweight='bold', fontsize=14, pad=20)
    
    # Sistema AWS
    aws_labels = ['Cómputo\n(Lambda+API)\nS/ 0.9K',
                 'Storage\n(DynamoDB+S3)\nS/ 1.8K',
                 'Seguridad\n(Cognito+WAF)\nS/ 4.2K',
                 'Comunicaciones\nS/ 0.07K',
                 'Observability\nS/ 0.18K',
                 'DevOps\n(Part-time)\nS/ 6K']
    aws_sizes = [900, 1800, 4200, 70, 180, 6000]
    aws_colors = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#00BCD4', '#FFC107']
    
    wedges2, texts2, autotexts2 = ax2.pie(aws_sizes, labels=aws_labels,
                                           autopct='%1.1f%%', startangle=90,
                                           colors=aws_colors, textprops={'fontsize': 10})
    ax2.set_title('Sistema AWS\nTotal: S/ 13,120/mes\n(70% ahorro)',
                 fontweight='bold', fontsize=14, pad=20, color='green')
    
    plt.suptitle('Comparación de Costos Mensuales de Infraestructura',
                fontweight='bold', fontsize=16, y=0.98)
    
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'infrastructure_costs.png', dpi=300, bbox_inches='tight')
    print(f"✓ Generado: infrastructure_costs.png")
    plt.close()


def generate_roi_projection():
    """
    Gráfica 5: ROI y break-even
    Muestra inversión vs retorno acumulado
    """
    fig, ax = plt.subplots(figsize=(14, 8))
    
    # Meses
    months = np.arange(0, 13)
    
    # Inversión inicial
    initial_investment = 75  # S/ 75K (miles)
    
    # Inversión acumulada (incluye costos mensuales AWS)
    investment = [initial_investment]
    monthly_cost = 13.12  # S/ 13.12K
    for m in range(1, 13):
        investment.append(initial_investment + (monthly_cost * m))
    
    # Retorno acumulado
    monthly_benefit = 669.88  # S/ 669.88K (ahorro + captura)
    returns = [0]
    for m in range(1, 13):
        returns.append(monthly_benefit * m)
    
    # Profit neto
    net_profit = [returns[i] - investment[i] for i in range(len(months))]
    
    # Plotear
    ax.plot(months, investment, marker='o', linewidth=3, color='#F44336',
           label='Inversión Acumulada', markersize=8)
    ax.plot(months, returns, marker='s', linewidth=3, color='#4CAF50',
           label='Retorno Acumulado', markersize=8)
    ax.plot(months, net_profit, marker='^', linewidth=3, color='#2196F3',
           label='Beneficio Neto', markersize=8, linestyle='--')
    
    # Break-even point
    break_even_month = 0.11  # ~3 días
    ax.axvline(x=break_even_month, color='purple', linestyle=':', linewidth=2,
              label='Break-even (~3 días)')
    ax.axhline(y=0, color='black', linestyle='-', linewidth=1, alpha=0.3)
    
    # Anotaciones
    ax.annotate('Break-even\n3 días',
               xy=(break_even_month, 0), xytext=(2, -500),
               arrowprops=dict(arrowstyle='->', color='purple', lw=2),
               fontsize=11, fontweight='bold', color='purple')
    
    ax.annotate(f'Beneficio año 1:\nS/ {net_profit[12]:.0f}K',
               xy=(12, net_profit[12]), xytext=(9, net_profit[12] - 1000),
               arrowprops=dict(arrowstyle='->', color='blue', lw=2),
               fontsize=11, fontweight='bold', color='blue')
    
    ax.set_xlabel('Meses desde implementación', fontweight='bold')
    ax.set_ylabel('Miles de Soles (S/)', fontweight='bold')
    ax.set_title('ROI y Break-Even Point: Migración a AWS', fontweight='bold', pad=20)
    ax.legend(loc='upper left', framealpha=0.9, fontsize=11)
    ax.grid(True, alpha=0.3)
    ax.set_xlim(0, 12)
    
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'roi_projection.png', dpi=300, bbox_inches='tight')
    print(f"✓ Generado: roi_projection.png")
    plt.close()


def generate_scalability_comparison():
    """
    Gráfica 6: Escalabilidad comparada
    Error rate vs RPS
    """
    fig, ax = plt.subplots(figsize=(14, 8))
    
    # RPS
    rps = np.arange(0, 550, 10)
    
    # Error rate sistema actual (exponencial desde 50 RPS)
    current_error = []
    for r in rps:
        if r <= 50:
            error = 0.02  # 2% error base
        else:
            # Crece exponencialmente
            error = 0.02 + (0.15 - 0.02) * ((r - 50) / 50) ** 2
            error = min(error, 1.0)  # Cap at 100%
        current_error.append(error * 100)
    
    # Error rate AWS (flat bajo)
    aws_error = [0.1 if r > 0 else 0 for r in rps]
    
    # Plotear
    ax.plot(rps, current_error, linewidth=4, color='#F44336',
           label='Sistema Actual (Legacy)', marker='o', markersize=4, markevery=10)
    ax.plot(rps, aws_error, linewidth=4, color='#2196F3',
           label='Con AWS (Serverless)', marker='s', markersize=4, markevery=10)
    
    # Áreas de operación
    ax.axvspan(0, 50, alpha=0.2, color='green', label='Operación Normal (0-50 RPS)')
    ax.axvspan(50, 200, alpha=0.2, color='yellow', label='Zona de Riesgo (50-200 RPS)')
    ax.axvspan(200, 550, alpha=0.2, color='red', label='Zona Crítica (200+ RPS)')
    
    # Línea de capacidad actual
    ax.axvline(x=50, color='black', linestyle='--', linewidth=2,
              label='Capacidad máxima actual')
    
    # Anotaciones
    ax.annotate('Sistema actual\nfalla aquí',
               xy=(50, current_error[5]), xytext=(100, 50),
               arrowprops=dict(arrowstyle='->', color='red', lw=2),
               fontsize=11, fontweight='bold', color='red')
    
    ax.annotate('AWS mantiene\n< 0.1% error',
               xy=(500, 0.1), xytext=(400, 15),
               arrowprops=dict(arrowstyle='->', color='blue', lw=2),
               fontsize=11, fontweight='bold', color='blue')
    
    ax.set_xlabel('Requests por segundo (RPS)', fontweight='bold')
    ax.set_ylabel('Error Rate (%)', fontweight='bold')
    ax.set_title('Escalabilidad: Error Rate vs Carga de Tráfico', fontweight='bold', pad=20)
    ax.legend(loc='upper left', framealpha=0.9, fontsize=10)
    ax.grid(True, alpha=0.3)
    ax.set_xlim(0, 550)
    ax.set_ylim(0, 100)
    
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'scalability_comparison.png', dpi=300, bbox_inches='tight')
    print(f"✓ Generado: scalability_comparison.png")
    plt.close()


def main():
    """Generar todas las gráficas"""
    print("=" * 60)
    print("Generando gráficas de análisis de negocio...")
    print("=" * 60)
    
    # Cargar datos
    current, aws, projections = load_data()
    
    # Generar gráficas
    generate_traffic_patterns(current)
    generate_revenue_comparison(current, aws)
    generate_lost_revenue_projection(projections)
    generate_infrastructure_costs(current, aws)
    generate_roi_projection()
    generate_scalability_comparison()
    
    print("=" * 60)
    print(f"✓ Todas las gráficas generadas en: {OUTPUT_DIR}")
    print("=" * 60)


if __name__ == '__main__':
    main()
