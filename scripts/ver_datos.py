import pandas as pd

# Configurar pandas para mostrar todas las columnas
pd.set_option('display.max_columns', None)
pd.set_option('display.width', None)
pd.set_option('display.max_colwidth', 30)

print("📊 VISUALIZACIÓN DE DATOS LIMPIOS\n")
print("=" * 100)

# Cargar datos
df = pd.read_csv("src/data/datos_limpios.csv")

print(f"\n📈 Total de registros: {len(df)}\n")

# Mostrar primeros registros
print("🔝 PRIMEROS 10 REGISTROS:")
print(df.head(10).to_string(index=True))

print("\n" + "=" * 100)

# Información general
print("\n📋 INFORMACIÓN GENERAL:")
print(df.info())

print("\n" + "=" * 100)

# Estadísticas
print("\n📊 ESTADÍSTICAS DESCRIPTIVAS:")
print(df.describe())

print("\n" + "=" * 100)

# Valores únicos por categoría
print("\n🏷️  VALORES ÚNICOS POR CATEGORÍA:\n")
categoricas = ['nivelEducativo', 'disciplina', 'tipoTarea', 'resultadoFinal', 'usoPosterior']

for col in categoricas:
    print(f"\n{col}:")
    conteo = df[col].value_counts()
    for valor, cantidad in conteo.items():
        porcentaje = (cantidad / len(df)) * 100
        print(f"  • {valor}: {cantidad} ({porcentaje:.1f}%)")

print("\n" + "=" * 100)
