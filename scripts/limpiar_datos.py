import pandas as pd
from datetime import datetime

# Diccionarios de traducción
NIVELES_EDUCATIVOS = {
    "High School": "Secundaria",
    "Undergraduate": "Pregrado",
    "Graduate": "Posgrado",
}

DISCIPLINAS = {
    "Computer Science": "Ciencias de la Computación",
    "Psychology": "Psicología",
    "Business": "Negocios",
    "Biology": "Biología",
    "Math": "Matemáticas",
    "Engineering": "Ingeniería",
    "History": "Historia",
}

TIPOS_TAREA = {
    "Studying": "Estudio",
    "Writing": "Redacción",
    "Coding": "Programación",
    "Homework Help": "Ayuda en tareas",
    "Brainstorming": "Lluvia de ideas",
    "Research": "Investigación",
}

RESULTADOS_FINALES = {
    "Assignment Completed": "Tarea completada",
    "Idea Drafted": "Idea desarrollada",
    "Confused": "Confundido",
    "Gave Up": "Abandonó",
}

print("🔍 Cargando datos originales...")
df = pd.read_csv("src/data/ai_assistant_usage_student_life.csv")
print(f"✅ {len(df)} registros cargados\n")

print("🧹 Limpiando y traduciendo datos...")

# Crear DataFrame limpio
df_limpio = pd.DataFrame()

# ID de sesión
df_limpio['idSesion'] = df['SessionID']

# Nivel educativo traducido
df_limpio['nivelEducativo'] = df['StudentLevel'].map(NIVELES_EDUCATIVOS)

# Disciplina traducida
df_limpio['disciplina'] = df['Discipline'].map(DISCIPLINAS)

# Fecha formateada
df_limpio['fechaSesion'] = pd.to_datetime(df['SessionDate']).dt.strftime('%d/%m/%Y')

# Duración en minutos (redondeado a 2 decimales)
df_limpio['duracionMinutos'] = df['SessionLengthMin'].round(2)

# Total de prompts
df_limpio['totalPrompts'] = df['TotalPrompts']

# Tipo de tarea traducido
df_limpio['tipoTarea'] = df['TaskType'].map(TIPOS_TAREA)

# Nivel de asistencia IA
df_limpio['nivelAsistenciaIA'] = df['AI_AssistanceLevel']

# Resultado final traducido
df_limpio['resultadoFinal'] = df['FinalOutcome'].map(RESULTADOS_FINALES)

# Uso posterior
df_limpio['usoPosterior'] = df['UsedAgain'].map({True: 'Sí', False: 'No'})

# Satisfacción
df_limpio['satisfaccion'] = df['SatisfactionRating']

# Verificar que no haya valores nulos por traducciones faltantes
print("\n📊 Verificando traducciones...")
columnas_verificar = ['nivelEducativo', 'disciplina', 'tipoTarea', 'resultadoFinal']
errores = 0

for col in columnas_verificar:
    nulos = df_limpio[col].isna().sum()
    if nulos > 0:
        print(f"  ❌ {col}: {nulos} valores sin traducir")
        errores += nulos
    else:
        print(f"  ✅ {col}: Todos traducidos")

if errores == 0:
    print("\n🎉 ¡Perfecto! Todos los valores están traducidos\n")
else:
    print(f"\n⚠️  Total de errores: {errores}\n")
    # Mostrar valores únicos sin traducir
    for col in columnas_verificar:
        if df_limpio[col].isna().any():
            valores_originales = df[df_limpio[col].isna()][col.replace('limpio_', '')].unique()
            print(f"Valores sin traducir en {col}: {valores_originales}")

# Guardar archivo limpio
output_path = "src/data/datos_limpios.csv"
df_limpio.to_csv(output_path, index=False)
print(f"💾 Archivo guardado: {output_path}")

# Mostrar estadísticas
print("\n📈 ESTADÍSTICAS:")
print(f"  • Total de registros: {len(df_limpio)}")
print(f"  • Columnas: {len(df_limpio.columns)}")
print(f"  • Rango de fechas: {df_limpio['fechaSesion'].min()} - {df_limpio['fechaSesion'].max()}")
print(f"  • Duración promedio: {df_limpio['duracionMinutos'].mean():.2f} minutos")
print(f"  • Satisfacción promedio: {df_limpio['satisfaccion'].mean():.2f}")

# Mostrar muestra
print("\n📝 Muestra de datos limpios (primeros 3 registros):")
print(df_limpio.head(3).to_string())
print()
