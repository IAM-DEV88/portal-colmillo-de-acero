document.addEventListener('DOMContentLoaded', () => {
  // Obtener elementos del DOM con tipado adecuado
  const searchInput = document.getElementById('search');
  const classFilter = document.getElementById('class-filter');
  const rankFilter = document.getElementById('rank-filter');
  const tableBody = document.getElementById('roster-table-body');
  const prevButton = document.getElementById('prev-button');
  const nextButton = document.getElementById('next-button');
  const pageInfo = document.getElementById('page-info');
  let currentPage = 1;
  const itemsPerPage = 10;
  let allMembers = [];
  let filteredMembers = [];
  let sortConfig = { key: 'name', direction: 'asc' };
  // Inicializar la tabla con los datos de window.rosterData
  function initTable() {
    if (!tableBody || !pageInfo) return;
    // Verificar si los datos están disponibles
    if (!window.rosterData) {
      // Error manejado silenciosamente
      return;
    }
    allMembers = [...window.rosterData.members];
    filteredMembers = [...allMembers];
    updateTable();
    updatePaginationInfo();
  }
  // Actualizar la tabla con los miembros filtrados y ordenados
  function updateTable() {
    if (!tableBody) return;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage);
    tableBody.innerHTML = paginatedMembers
      .map((member) => {
        const classData = window.rosterData.classInfo[member.class] || {
          color: 'FFFFFF',
          name: member.class,
        };
        const className = classData.name;
        const classColor = classData.color;
        return `
        <tr class="hover:bg-steel-dark/30 transition-colors">
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <img src="/images/avatars/class_${className}.jpg" alt="${className}" class="w-6 h-6 mr-2" onerror="this.src='/images/avatars/default.png'"/>
              <span style="color: #${classColor}">${className}</span>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-white">${member.name}</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 py-1 text-xs rounded-full bg-steel-dark/50 text-text-muted">
              ${member.rank}
            </span>
          </td>
          <td class="px-6 py-4 text-text-muted">${member.publicNote || '-'}</td>
        </tr>
      `;
      })
      .join('');
    updatePaginationInfo();
    updateSortIndicators();
  }
  // Función para ordenar los miembros
  function sortMembers(key) {
    if (sortConfig.key === key) {
      sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
      sortConfig.key = key;
      sortConfig.direction = 'asc';
    }
    filteredMembers.sort((a, b) => {
      // Asegurarse de que la clave sea una clave válida de RosterMember
      const sortKey = sortConfig.key;
      const aValue = a[sortKey];
      const bValue = b[sortKey];
      if (aValue === undefined || bValue === undefined) return 0;
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    currentPage = 1;
    updateTable();
  }
  // Función para actualizar la información de paginación
  function updatePaginationInfo() {
    if (!pageInfo) return;
    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
    pageInfo.textContent = `Página ${currentPage} de ${totalPages} (${filteredMembers.length} miembros)`;
    if (prevButton) prevButton.disabled = currentPage === 1;
    if (nextButton) nextButton.disabled = currentPage >= totalPages;
  }
  // Función para actualizar los indicadores de ordenación
  function updateSortIndicators() {
    document.querySelectorAll('th[data-sort]').forEach((th) => {
      const sortKey = th.getAttribute('data-sort');
      if (!sortKey) return;
      const indicator = th.querySelector('.sort-indicator');
      if (!indicator) return;
      if (sortConfig.key === sortKey) {
        indicator.textContent = sortConfig.direction === 'asc' ? '↑' : '↓';
        indicator.classList.remove('invisible');
      } else {
        indicator.textContent = '↕';
        indicator.classList.add('invisible');
      }
    });
  }
  // Función para filtrar miembros según los filtros aplicados
  function filterMembers() {
    const searchTerm =
      (searchInput === null || searchInput === void 0 ? void 0 : searchInput.value.toLowerCase()) ||
      '';
    const selectedClass =
      (classFilter === null || classFilter === void 0 ? void 0 : classFilter.value) || 'all';
    const selectedRank =
      (rankFilter === null || rankFilter === void 0 ? void 0 : rankFilter.value) || 'all';
    filteredMembers = allMembers.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchTerm) ||
        (member.publicNote && member.publicNote.toLowerCase().includes(searchTerm));
      const matchesClass = selectedClass === 'all' || member.class === selectedClass;
      const matchesRank = selectedRank === 'all' || member.rank === selectedRank;
      return matchesSearch && matchesClass && matchesRank;
    });
    currentPage = 1;
    updateTable();
  }
  // Event listeners
  if (searchInput) {
    searchInput.addEventListener('input', filterMembers);
  }
  if (classFilter) {
    classFilter.addEventListener('change', filterMembers);
  }
  if (rankFilter) {
    rankFilter.addEventListener('change', filterMembers);
  }
  if (prevButton) {
    prevButton.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        updateTable();
      }
    });
  }
  if (nextButton) {
    nextButton.addEventListener('click', () => {
      const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        updateTable();
      }
    });
  }
  // Inicializar la tabla
  initTable();
});
