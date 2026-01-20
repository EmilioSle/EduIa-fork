import { use, useEffect } from "react";
import { cargarDatos } from "./services/servicioDatos";

const App = () => {
  useEffect(() => {
    cargarDatos().then(data => {
      console.log("📊 Total de registros cargados:", data.length);
      console.log("📝 Primeros 5 registros:", data.slice(0, 5));
      console.log("🔍 Estructura de un registro:", data[0]);
      console.table(data.slice(0, 10));
    });
  }, []);
  
  return <h1>EduIA</h1>;
}

export default App;
