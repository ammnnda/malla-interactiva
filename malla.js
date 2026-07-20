fetch('malla.json')
  .then(res => res.json())
  .then(ramos => construirMalla(ramos));

let estados = JSON.parse(localStorage.getItem('estadosMalla')) || {};
let seleccionActual = null;
let datosRamos = [];

function construirMalla(ramos) {
  datosRamos = ramos;
  const contenedor = document.getElementById('malla');
  const totalSemestres = Math.max(...ramos.map(r => r.semestre));

  for (let s = 1; s <= totalSemestres; s++) {
    const columna = document.createElement('div');
    columna.className = 'columna';

    const titulo = document.createElement('h3');
    titulo.textContent = 'Semestre ' + s;
    columna.appendChild(titulo);

    const ramosDelSemestre = ramos.filter(r => r.semestre === s);

    ramosDelSemestre.forEach(ramo => {
      const div = document.createElement('div');
      div.className = 'ramo';
      div.dataset.codigo = ramo.codigo;
      div.textContent = ramo.nombre;

      // Estado inicial: usa localStorage si existe, si no usa el "aprobado" del JSON
      if (!estados[ramo.codigo]) {
        estados[ramo.codigo] = ramo.aprobado ? 'aprobado' : 'pendiente';
      }

      aplicarClaseEstado(div, estados[ramo.codigo]);

      div.addEventListener('click', () => manejarClick(ramo.codigo));

      div.addEventListener('contextmenu', (e) => {
        e.preventDefault(); // evita que salga el menú del navegador
        cambiarEstado(ramo.codigo);
      });

      columna.appendChild(div);
    });

    contenedor.appendChild(columna);
  }

  crearLeyenda();
}

function aplicarClaseEstado(div, estado) {
  div.classList.remove('aprobado', 'cursando', 'pendiente');
  div.classList.add(estado);
}

function cambiarEstado(codigo) {
  const ciclo = ['pendiente', 'cursando', 'aprobado'];
  const actual = estados[codigo] || 'pendiente';
  const siguienteIndex = (ciclo.indexOf(actual) + 1) % ciclo.length;
  estados[codigo] = ciclo[siguienteIndex];

  localStorage.setItem('estadosMalla', JSON.stringify(estados));

  const div = document.querySelector(`.ramo-item[data-codigo="${codigo}"]`) 
    || document.querySelector(`[data-codigo="${codigo}"]`);
  if (div) aplicarClaseEstado(div, estados[codigo]);
}

function manejarClick(codigo) {
  if (seleccionActual === codigo) {
    seleccionActual = null;
    limpiarResaltados();
    return;
  }

  seleccionActual = codigo;
  limpiarResaltados();

  const prerrequisitos = obtenerPrerrequisitosRecursivos(codigo, datosRamos);
  const dependientes = obtenerDependientes(codigo, datosRamos);

  document.querySelectorAll('[data-codigo]').forEach(div => {
    const c = div.dataset.codigo;
    if (c === codigo) {
      div.classList.add('seleccionado');
    } else if (prerrequisitos.has(c)) {
      div.classList.add('prerrequisito');
    } else if (dependientes.has(c)) {
      div.classList.add('dependiente');
    }
  });
}

function obtenerPrerrequisitosRecursivos(codigo, ramos, encontrados = new Set()) {
  const ramo = ramos.find(r => r.codigo === codigo);
  if (!ramo) return encontrados;

  ramo.prerrequisitos.forEach(pre => {
    if (!encontrados.has(pre)) {
      encontrados.add(pre);
      obtenerPrerrequisitosRecursivos(pre, ramos, encontrados);
    }
  });

  return encontrados;
}

function obtenerDependientes(codigo, ramos) {
  const encontrados = new Set();
  ramos.forEach(r => {
    if (r.prerrequisitos.includes(codigo)) {
      encontrados.add(r.codigo);
    }
  });
  return encontrados;
}

function limpiarResaltados() {
  document.querySelectorAll('[data-codigo]').forEach(div => {
    div.classList.remove('seleccionado', 'prerrequisito', 'dependiente');
  });
}

function crearLeyenda() {
  const leyenda = document.createElement('div');
  leyenda.id = 'leyenda';
  leyenda.innerHTML = `
    <div class="leyenda-item"><div class="caja" style="background:#b8db76"></div> Aprobado</div>
    <div class="leyenda-item"><div class="caja" style="background:#f7b7d6"></div> Cursando</div>
    <div class="leyenda-item"><div class="caja" style="background:#e0d2c3;border:1px solid #c9b193"></div> Pendiente</div>
    <div class="leyenda-item"><div class="caja" style="background:#f783a8"></div> Prerrequisito (falta)</div>
    <div class="leyenda-item"><div class="caja" style="background:#ffabc7"></div> Requiere este ramo</div>
    <div class="leyenda-item"><div class="caja" style="border:3px solid #664c32"></div> Seleccionado</div>
  `;
  document.body.appendChild(leyenda);
}
