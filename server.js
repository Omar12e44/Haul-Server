// Importa los módulos necesarios
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./conexion/db');

// Crea una instancia de la aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear el cuerpo de las solicitudes como JSON
app.use(bodyParser.json());

// Ruta GET para "/registro"
app.get('/', (req, res) => {
  res.send('Bienvenido a la página de registro');
});

// Ruta POST para "/registro"
app.post('/registro', (req, res) => {
    
  const { uid, nombre, email } = req.body;

  // Guardar los datos en la base de datos MySQL
  db.query('INSERT INTO users (id, user_name, user_email) VALUES (?, ?, ?)', [uid, nombre, email], (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    res.status(200).json({ message: 'Usuario registrado exitosamente' });
  });
});

// Ruta POST para "/login"
app.post('/login', (req, res) => {
    const { uid } = req.body;

    // Consultar el UID en la base de datos MySQL
    db.query('SELECT * FROM users WHERE id = ?', [uid], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Error en el servidor' });
        }

        if (results.length > 0) {
            // El UID coincide, permite el acceso
            res.status(200).json({ message: 'Inicio de sesión exitoso' });
        } else {
            // El UID no coincide, deniega el acceso
            res.status(403).json({ error: 'Inicio de sesión denegado' });
        }
    });
});

app.post('/cargar', (req, res) => {
  const { uid, peso, consideraciones, largo, ancho, altura, destino } = req.body;
  // Guardar los datos en la base de datos MySQL
  db.query(
    'INSERT INTO cargas (user, peso, consideraciones, largo, ancho, altura, destino) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [uid, peso, consideraciones, largo, ancho, altura, destino],
    (error, results) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error en el servidor' });
      }
      res.status(200).json({ message: 'Carga guardada exitosamente' });
    }
  );
});

app.get('/cargas/:uid', (req, res) => {
  const uid = req.params.uid;
  console.log(uid);

  // Consulta para obtener las cargas del usuario por UID
  const sql = 'SELECT * FROM cargas WHERE user = ?';

  db.query(sql, [uid], (err, result) => {
    if (err) {
      console.error('Error al obtener las cargas del usuario:', err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'No se encontraron cargas para este usuario' });
    }

    // Enviar las cargas encontradas como respuesta
    res.status(200).json(result);
  });
});


app.get('/perfil/:uid', (req, res) => {
  const uid = req.params.uid;
  console.log('UID recibido:', uid); // Agrega esta línea para imprimir el UID recibido

  // Consultar la base de datos MySQL para obtener la información del usuario con el UID proporcionado
  db.query('SELECT * FROM users WHERE id = ?', [uid], (error, results) => {
    if (error) {
      console.error('Error al obtener la información del usuario:', error);
      return res.status(500).json({ error: 'Error en el servidor' });
    }

    // Verificar si se encontró un usuario con el UID proporcionado
    if (results.length > 0) {
      // Enviar la información del usuario al cliente React Native
      res.status(200).json(results[0]);
    } else {
      // Si no se encuentra ningún usuario con el UID proporcionado, devolver un mensaje de error
      res.status(404).json({ message: 'Usuario no encontrado' });
    }
  });
});


// Obtener las opciones del enum transport_type desde la base de datos
const obtenerOpcionesTransportType = () => {
  return new Promise((resolve, reject) => {
    db.query('SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = "transports" AND COLUMN_NAME = "transportTipo"', (error, results) => {
      if (error) {
        reject(error);
      } else {
        // Extraer las opciones del enum
        const match = results[0].COLUMN_TYPE.match(/enum\((.*)\)/);
        const options = match[1].split(',').map(option => option.replace(/'/g, '').trim());
        resolve(options);
      }
    });
  });
};

// Ruta GET para obtener las opciones del enum transportTipo
app.get('/options/transport_type', (req, res) => {
  obtenerOpcionesTransportType()
    .then(options => {
      res.status(200).json(options);
    })
    .catch(error => {
      console.error('Error al obtener opciones de transportTipo:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    });
});

app.get('/buscar/operador/:ciudad/:tipoTransporte', (req, res) => {
  console.log('Buscando operador...');
  const city =  req.params.ciudad;
  const tipoTransporte = req.params.tipoTransporte
  
  console.log('Llega: ', city, tipoTransporte);

  const query = `
    SELECT * 
    FROM users u 
    JOIN transports t ON u.id = t.transport_driver 
    WHERE u.user_type = 'Operador' AND t.transportTipo = ? AND u.user_city = ?;
  `;

  db.query(query, [tipoTransporte, city], (error, results) => {
    if (error) {
      console.error('Error al ejecutar la consulta:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
      return;
    }
    console.log('Resultados de la consulta:', results);
    res.status(200).json(results);
  });
});

// Inicia el servidor y escucha en el puerto especificado
app.listen(PORT, () => {
  console.log(`Servidor en ejecución en el puerto ${PORT}`);
});
