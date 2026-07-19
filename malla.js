fetch('malla.json')
  .then(res => res.json())
  .then(ramos => construirMalla(ramos));

function construirMalla(ramos) {
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
      div.className = 'ramo' + (ramo.aprobado ? ' aprobado' : '');
      div.textContent = ramo.nombre;
      div.dataset.codigo = ramo.codigo;

      div.addEventListener('click', () => manejarClick(ramo.codigo, ramos));

      columna.appendChild(div);
    });

    contenedor.appendChild(columna);
  }

  crearLeyenda();
}

let seleccionActual = null;

function manejarClick(codigo, ramos) {
  // Si haces clic en el mismo ramo, deselecciona
  if (seleccionActual === codigo) {
    seleccionActual = null;
    limpiarResaltados();
    return;
  }

  seleccionActual = codigo;
  limpiarResaltados();

  const prerrequisitos = obtenerPrerrequisitosRecursivos(codigo, ramos);
  const dependientes = obtenerDependientes(codigo, ramos);

  document.querySelectorAll('.ramo').forEach(div => {
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

// Encuentra TODOS los prerrequisitos, incluso los prerrequisitos de los prerrequisitos
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

// Encuentra los ramos que tienen a "codigo" como prerrequisito directo
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
  document.querySelectorAll('.ramo').forEach(div => {
    div.classList.remove('seleccionado', 'prerrequisito', 'dependiente');
  });
}

function crearLeyenda() {
  const leyenda = document.createElement('div');
  leyenda.id = 'leyenda';
  leyenda.innerHTML = `
    <div class="leyenda-item"><div class="caja" style="background:#2e7d32"></div> Aprobado</div>
    <div class="leyenda-item"><div class="caja" style="background:#e65100"></div> Prerrequisito (falta)</div>
    <div class="leyenda-item"><div class="caja" style="background:#1565c0"></div> Requiere este ramo</div>
    <div class="leyenda-item"><div class="caja" style="border:3px solid #ffeb3b"></div> Seleccionado</div>
  `;
  document.body.appendChild(leyenda);
}
