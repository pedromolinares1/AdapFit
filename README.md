<div align="center"> <h1>🏋️ AdaptFit</h1> 
<p><b>Sistema de recomendación de entrenamientos personalizados basado en el rendimiento del usuario</b></p>
<p> <a href="https://adapfit-8ojd.onrender.com/"><img src="https://img.shields.io/badge/Demo-en%20l%C3%ADnea-46E3B7?style=for-the-badge&logo=render&logoColor=white" alt="Demo en línea"></a> 
<a href="https://TU-SERVICIO.onrender.com/docs"><img src="https://img.shields.io/badge/API-Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black" alt="Documentación de la API"></a> </p> 
<p> <img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python"> <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI">
<img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL">
<img src="https://img.shields.io/badge/Render-000000?style=flat-square&logo=render&logoColor=white" alt="Render"> </p> 

  <p> <a href="https://adapfit-8ojd.onrender.com/">
<b>🔗 Ver la página en línea</b></a> </p> </div>
<hr> 

<h2>📖 Descripción</h2>
<p> AdaptFit es una plataforma web dirigida a personas que entrenan de forma independiente.
A partir de los datos que cada usuario registra en sus sesiones (repeticiones, tiempos, cargas y percepción del esfuerzo), 
el sistema le recomienda rutinas ajustadas a su rendimiento. </p>

<h2>🎓 Contexto académico</h2> 
<p> Proyecto de investigación del programa de <b>Ingeniería de Sistemas</b> de la <b>Corporación Universitaria Americana</b> 
(Barranquilla, Colombia), con enfoque cuantitativo y un recomendador de tipo híbrido. </p>
<ul> <li><b>Asignatura:</b> Proyecto de Investigación II (10A)</li> <li><b>Docente:</b> Diana Suarez</li> </ul> 

<h2>✨ Funcionalidades (MVP versión beta)</h2> 

<table> <thead> <tr> <th align="center">#</th> <th align="left">Funcionalidad</th> <th align="left">Rol</th> </tr> </thead> 
<tbody> <tr><td align="center">1</td>
<td>Registrarse y autorizar el tratamiento de datos</td><td>Usuario</td></tr> <tr>
<td align="center">2</td><td>Iniciar sesión</td><td>Usuario</td></tr>
<tr><td align="center">3</td><td>Configurar perfil</td><td>Usuario</td></tr>
<tr><td align="center">4</td><td>Consultar rutina recomendada</td><td>Usuario</td></tr>
<tr><td align="center">5</td><td>Registrar sesión de entrenamiento</td><td>Usuario</td></tr> 
<tr><td align="center">6</td><td>Rectificar o eliminar datos personales</td><td>Usuario</td></tr> 
<tr><td align="center">7</td><td>Mantener catálogo de ejercicios</td><td>Administrador</td></tr> </tbody> </table> 

<h2>🛠️ Tecnologías</h2>
<ul> 
  <li><b>Backend:</b> Python, FastAPI, Uvicorn</li> <li><b>Base de datos:</b> PostgreSQL (SQLAlchemy como ORM)</li>
  <li><b>Frontend:</b> <i>[completar: HTML/CSS/JS, React, etc.]</i></li>
  <li><b>Despliegue:</b> Render</li> </ul>
  
<h2>🚀 Ejecución en local</h2> 
<h3>1. Clonar el repositorio</h3> 
<pre><code>git clone https://github.com/pedromolinares1/AdapFit.git cd AdapFit</code></pre> 
<h3>2. Crear el entorno virtual e instalar dependencias</h3> 
<pre><code>python -m venv venv # Windows venv\Scripts\activate # macOS / Linux source venv/bin/activate pip install -r requirements.txt</code></pre> 
<h3>3. Configurar las variables de entorno</h3> <p>Crea un archivo <code>.env</code> en la carpeta del backend:</p> 
<pre><code>DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/adaptfit SECRET_KEY=una_clave_secreta_larga</code></pre> 
<h3>4. Iniciar el servidor</h3> <pre><code>uvicorn main:app --reload</code></pre> <p> La API quedará disponible en <code>http://127.0.0.1:8000</code> y la documentación interactiva en <code>http://127.0.0.1:8000/docs</code>. </p>

<h2>☁️ Despliegue en Render</h2>
<ol> 
  <li><b>Base de datos:</b> se creó una instancia de PostgreSQL en Render y se copió su <i>Internal Database URL</i>.</li>
  <li> <b>Web Service:</b> se conectó este repositorio con: <ul> <li><b>Build Command:</b> <code>pip install -r requirements.txt</code></li> <li><b>Start Command:</b> <code>uvicorn main:app --host 0.0.0.0 --port $PORT</code></li> </ul> </li>
  <li><b>Variables de entorno</b> configuradas en Render: <code>DATABASE_URL</code> y <code>SECRET_KEY</code>.</li> </ol> 
  
  <h2>🔐 Variables de entorno</h2>
  <table> <thead> <tr> 
  <th align="left">Variable</th>
  <th align="left">Descripción</th> </tr> </thead> 
    <tbody> <tr><td><code>DATABASE_URL</code></td>
      <td>Cadena de conexión a PostgreSQL</td></tr><tr><td><code>SECRET_KEY</code></td>
      <td>Clave para firmar los tokens de sesión</td></tr> </tbody> </table>
      
<h2>👥 Autores</h2> 
<ul>
  <li><b>Pedro Molinares</b></li>
  <li><b>Angie Bernal</b></li> </ul> 
<h2>📄 Licencia</h2> 
<p>Proyecto con fines académicos. Todos los derechos reservados a sus autores.</p>
