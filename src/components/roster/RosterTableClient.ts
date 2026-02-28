
// RosterTableClient.ts - Lógica del cliente para el componente RosterTable

export function initRosterTable() {
    // Obtener los datos del roster desde los atributos de datos
    const configData = document.getElementById('roster-config-data');
    if (!configData) {
      console.error('No se pudo encontrar el contenedor de datos del roster');
      return;
    }
    
    const rosterInfo = configData ? JSON.parse(configData.getAttribute('data-roster') || '{}') : {};
    const roleNamesData = configData ? JSON.parse(configData.getAttribute('data-roles') || '{}') : {};
    const professionNamesData = configData ? JSON.parse(configData.getAttribute('data-professions') || '{}') : {};
    const raceNamesData = configData ? JSON.parse(configData.getAttribute('data-races') || '{}') : {};
    const factionNamesData = configData ? JSON.parse(configData.getAttribute('data-factions') || '{}') : {};
    const raidRegistrationsData = configData ? JSON.parse(configData.getAttribute('data-registrations') || '[]') : [];

    // Función para inicializar tooltips
    function initTooltips() {
      document.querySelectorAll('.tooltip-container').forEach((container) => {
        const tooltip = container.querySelector('.tooltip') as HTMLElement;
        if (!tooltip) return;

        const updatePosition = () => {
          const rect = container.getBoundingClientRect();
          const tooltipRect = tooltip.getBoundingClientRect();
          const left = rect.left + rect.width / 2 - tooltipRect.width / 2;
          const adjustedLeft = Math.max(10, Math.min(window.innerWidth - tooltipRect.width - 10, left));
          tooltip.style.left = `${adjustedLeft}px`;
        };

        container.addEventListener('mouseenter', updatePosition);
        window.addEventListener('resize', updatePosition);
      });
    }

    // Inicializar tooltips
    initTooltips();

    // Obtener elementos del DOM
    const searchInput = document.getElementById('search') as HTMLInputElement;
    const classFilter = document.getElementById('class-filter') as HTMLSelectElement;
    const rankFilter = document.getElementById('rank-filter') as HTMLSelectElement;
    const rosterGrid = document.getElementById('roster-grid');
    const prevButton = document.getElementById('prev-button') as HTMLButtonElement;
    const nextButton = document.getElementById('next-button') as HTMLButtonElement;
    const pageInfo = document.getElementById('page-info');
    const sortButtons = document.querySelectorAll('.sort-button');

    let currentPage = 1;
    let itemsPerPage = 6; 
    let allMembers = [];
    let filteredMembers = [];
    let sortConfig = { key: 'name', direction: 'asc' };

    // Modal elements
    const modal = document.getElementById('member-modal');
    const closeModalX = document.getElementById('close-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');

    // Modal content elements
    const modalName = document.getElementById('modal-character-name');
    const modalRank = document.getElementById('modal-header-rank');
    const modalNote = document.getElementById('modal-note');
    const modalTags = document.getElementById('modal-tags');
    const modalClassIcon = document.getElementById('modal-class-icon');


    // Function to update recognitions display
    function updateRecognitionsDisplay(member) {
        const container = document.getElementById('recognitions-container');
        if (!container) return;

        let html = '';
        if (member.recognitions && member.recognitions.length > 0) {
          const groupedRecs = member.recognitions.reduce((acc, rec) => {
            const date = new Date(rec.date);
            let dateStr = 'Fecha desconocida';
            if (!isNaN(date.getTime())) {
              const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
              dateStr = `${monthNames[date.getMonth()]}-${date.getFullYear().toString().slice(2)}`;
            }
            const key = rec.title || 'Mención Honorífica';
            if (!acc[key]) acc[key] = [];
            acc[key].push({ ...rec, dateStr });
            return acc;
          }, {});

          Object.entries(groupedRecs).forEach(([title, recs]: [string, any]) => {
            recs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          });

          html += '<div class="space-y-2">';
          Object.entries(groupedRecs).forEach(([title, recs]: [string, any]) => {
            const firstRec = recs[0];
            html += `
              <div class="p-2 bg-gray-800/40 rounded border border-gray-700/30">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-bold text-amber-200">${title}</span>
                  <span class="text-[10px] text-gray-500">${firstRec.dateStr}</span>
                </div>
                <p class="text-[10px] text-gray-400 italic leading-tight">${firstRec.description}</p>
              </div>
            `;
          });
          html += '</div>';
        } else {
          html = '<p class="text-xs text-gray-500 text-center py-4 italic">Sin reconocimientos registrados</p>';
        }
        container.innerHTML = html;
        
        const badge = document.getElementById('badge-recognitions');
        if (badge) {
          if (member.recognitions?.length > 0) {
            badge.textContent = member.recognitions.length;
            badge.classList.remove('hidden');
          } else {
            badge.classList.add('hidden');
          }
        }
    }

    // Function to update raids display
    function updateRaidsDisplay(member) {
        const container = document.getElementById('raids-container');
        if (!container) return;

        let html = '';
        const allCores = [];
        
        if (member.leaderData) {
          if (member.leaderData.cores && Array.isArray(member.leaderData.cores)) {
            member.leaderData.cores.forEach(core => allCores.push({ ...core }));
          }
          Object.entries(member.leaderData).forEach(([key, data]: [string, any]) => {
            if (key === 'cores' || key === 'lastUpdate') return;
            if (data && typeof data === 'object' && data.cores && Array.isArray(data.cores)) {
              data.cores.forEach(core => allCores.push({ ...core }));
            }
          });
        }

        if (allCores.length > 0) {
          html += '<div class="grid grid-cols-1 gap-2">';
          allCores.forEach(core => {
            html += `
              <div class="p-2 bg-gray-800/40 rounded border border-amber-900/20 flex flex-col gap-1">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-amber-100">${core.raid || 'Raid'}</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Líder</span>
                </div>
                <div class="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <svg class="w-3 h-3 text-amber-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>${core.schedule || 'Horario no especificado'}</span>
                </div>
              </div>
            `;
          });
          html += '</div>';
        } else {
          html = '<p class="text-xs text-gray-500 text-center py-4 italic">No se encontraron registros de liderazgo en raids</p>';
        }
        container.innerHTML = html;

        const badge = document.getElementById('badge-raids');
        if (badge) {
          if (allCores.length > 0) {
            badge.textContent = allCores.length.toString();
            badge.classList.remove('hidden');
          } else {
            badge.classList.add('hidden');
          }
        }
    }

    // Modal tabs switching
    (window as any).switchModalTab = function(tabId) {
        document.querySelectorAll('.modal-tab').forEach(tab => {
          tab.classList.remove('text-amber-400', 'border-amber-500');
          tab.classList.add('text-gray-400', 'border-transparent');
        });
        const selectedTab = document.getElementById(`tab-${tabId}`);
        if (selectedTab) {
          selectedTab.classList.remove('text-gray-400', 'border-transparent');
          selectedTab.classList.add('text-amber-400', 'border-amber-500');
        }
        document.querySelectorAll('.modal-pane').forEach(pane => pane.classList.add('hidden'));
        document.getElementById(`pane-${tabId}`)?.classList.remove('hidden');
    };

    // Open modal
    (window as any).openMemberModal = function(member) {
        if (!modal) return;
        
        if (modalName) modalName.textContent = member.name;
        
        if (modalRank) {
          modalRank.textContent = member.rank;
          modalRank.className = `text-xs uppercase font-bold ${
            member.rank.toLowerCase().includes('admin') ? 'text-amber-400' :
            member.rank.toLowerCase().includes('oficial') ? 'text-blue-400' :
            'text-gray-400'
          }`;
        }

        if (modalClassIcon) {
          const classData = rosterInfo.classInfo[member.class] || { color: 'FFFFFF', name: member.class };
          modalClassIcon.style.backgroundColor = `#${classData.color}`;
          modalClassIcon.innerHTML = `<img src="/images/avatars/class_${classData.name}.jpg" class="w-full h-full rounded-md object-cover border border-black/20" onerror="this.src='/images/avatars/default.png'" />`;
          
          if (modalName) modalName.style.color = `#${classData.color}`;
        }


        const noteEl = document.getElementById('modal-note');
        if (noteEl) noteEl.textContent = member.publicNote || 'Sin nota pública';

        // Update tags
        const tagsContainer = document.getElementById('modal-tags');
        if (tagsContainer) {
          let tagsHtml = '';
          const nv = member.noteValidation;
          if (nv?.isValid) {
            if (nv.mainAlt) {
              const isMain = nv.mainAlt === 'M';
              tagsHtml += `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isMain ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}">${isMain ? 'MAIN' : 'ALT'}</span>`;
            }
            if (nv.gearScore) {
              tagsHtml += `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">${nv.gearScore}k GS</span>`;
            }
            if (nv.role) {
              const roleInfo = roleNamesData[nv.role] || { name: nv.role, color: 'text-gray-300', bgColor: 'bg-gray-500/20' };
              tagsHtml += `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${roleInfo.bgColor} ${roleInfo.color} border border-current opacity-70">${roleInfo.name}</span>`;
            }
          }
          tagsContainer.innerHTML = tagsHtml;
        }

        updateRecognitionsDisplay(member);
        updateRaidsDisplay(member);
        (window as any).switchModalTab('general');
        
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };

    if (closeModalX) closeModalX.onclick = () => {
        modal?.classList.add('hidden');
        document.body.style.overflow = '';
    };

    if (modalBackdrop) modalBackdrop.onclick = () => {
        modal?.classList.add('hidden');
        document.body.style.overflow = '';
    };


    function updateItemsPerPage() {
        itemsPerPage = window.innerWidth < 768 ? 10 : 9;
        updateTable();
        updatePaginationInfo();
    }

    window.addEventListener('resize', updateItemsPerPage);

    function initTable() {
        if (!rosterGrid || !pageInfo) return;
        allMembers = [...rosterInfo.members];
        
        const sortMembers = () => {
          allMembers.sort((a, b) => {
            let valA, valB;
            if (sortConfig.key === 'name') {
              const getRankPriority = (rank) => {
                const r = rank?.toLowerCase() || '';
                if (r.includes('oficial')) return 0;
                if (r.includes('administrador')) return 1;
                if (r.includes('explorador')) return 2;
                if (r.includes('iniciado')) return 3;
                if (r.includes('aspirante')) return 4;
                return 5;
              };
              const pA = getRankPriority(a.rank);
              const pB = getRankPriority(b.rank);
              if (pA !== pB) return sortConfig.direction === 'asc' ? pA - pB : pB - pA;
              valA = (a.name || '').toLowerCase();
              valB = (b.name || '').toLowerCase();
            } else {
              valA = (a.publicNote || '').length;
              valB = (b.publicNote || '').length;
            }
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
          });
          filterMembers();
        };

        sortButtons.forEach(button => {
          button.addEventListener('click', () => {
            const sortKey = (button as HTMLElement).dataset.sort;
            if (sortConfig.key === sortKey) {
              sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
            } else {
              sortConfig.key = sortKey;
              sortConfig.direction = 'asc';
            }
            sortMembers();
            updateTable();
            updatePaginationInfo();
          });
        });

        const filterMembers = () => {
          const searchTerm = searchInput?.value.toLowerCase() || '';
          const selectedClass = classFilter?.value || '';
          const selectedRank = rankFilter?.value || '';
          filteredMembers = allMembers.filter(m => {
            return m.name.toLowerCase().includes(searchTerm) &&
                   (selectedClass === '' || m.class === selectedClass) &&
                   (selectedRank === '' || m.rank === selectedRank);
          });
          currentPage = 1;
        };

        if (searchInput) searchInput.oninput = () => { filterMembers(); updateTable(); updatePaginationInfo(); };
        if (classFilter) classFilter.onchange = () => { filterMembers(); updateTable(); updatePaginationInfo(); };
        if (rankFilter) rankFilter.onchange = () => { filterMembers(); updateTable(); updatePaginationInfo(); };

        sortMembers();
        updateTable();
        updatePaginationInfo();
    }

    function getMemberRaidCount(member) {
        if (!member?.leaderData) return 0;
        const cores = [];
        if (Array.isArray(member.leaderData.cores)) cores.push(...member.leaderData.cores);
        Object.entries(member.leaderData).forEach(([key, data]: [string, any]) => {
          if (key === 'cores' || key === 'lastUpdate') return;
          if (data?.cores && Array.isArray(data.cores)) cores.push(...data.cores);
        });
        return cores.length;
    }

    function updateTable() {
        if (!rosterGrid) return;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginated = filteredMembers.slice(startIndex, startIndex + itemsPerPage);
        
        rosterGrid.innerHTML = paginated.map(member => {
            const classData = rosterInfo.classInfo[member.class] || { color: 'FFFFFF', name: member.class };
            const raidCount = getMemberRaidCount(member);
            const recCount = member.recognitions?.length || 0;
            
            return `
              <div class="group bg-gradient-to-br from-gray-900/60 to-gray-800/50 backdrop-blur-sm rounded-md p-1 sm:p-4 transition-all duration-300 overflow-hidden cursor-pointer hover:bg-gray-800/60 hover:shadow-lg hover:shadow-amber-900/20 relative" 
                   style="border: 1px solid #${classData.color}66;"
                   onclick='window.openMemberModal(${JSON.stringify(member).replace(/'/g, '&#39;')})'>
                <div class="absolute top-0 left-0 w-1 h-full opacity-50" style="background-color: #${classData.color};"></div>
                <div class="absolute top-1 right-1 flex flex-col gap-0.5 sm:flex-row sm:gap-1 z-10">
                  ${raidCount > 0 ? `<div class="px-1.5 py-0.5 rounded text-[9px] sm:text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1"><span>${raidCount}</span></div>` : ''}
                  ${recCount > 0 ? `<div class="px-1.5 py-0.5 rounded text-[9px] sm:text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1"><span>${recCount}</span></div>` : ''}
                </div>
                <div class="flex flex-col items-start pl-2">
                  <div class="flex items-center gap-1 sm:gap-2">
                    <div class="relative flex-shrink-0 hidden sm:block">
                      <img src="/images/avatars/class_${classData.name}.jpg" class="w-10 h-10 sm:w-12 sm:h-12 rounded-md shadow-lg border border-gray-700/50 object-cover" onerror="this.src='/images/avatars/default.png'" />
                      <div class="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 h-4 rounded-full border-2 border-gray-900" style="background-color: #${classData.color};"></div>
                    </div>
                    <div class="flex-1 min-w-0 flex-grow">
                      <div class="font-bold truncate text-sm sm:text-lg italic pr-1" style="color: #${classData.color}">${member.name}</div>
                      <span class="text-[10px] sm:text-xs px-2 py-0.5 rounded-md font-medium border ${
                        member.rank.toLowerCase().includes('admin') ? 'border-amber-500/40 text-amber-300' :
                        member.rank.toLowerCase().includes('oficial') ? 'border-blue-500/40 text-blue-300' :
                        'border-gray-500/40 text-gray-300'
                      }">${member.rank}</span>
                    </div>
                  </div>
                </div>
              </div>
            `;
        }).join('');
    }

    function updatePaginationInfo() {
        if (!pageInfo) return;
        const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
        pageInfo.innerHTML = `
          <span class="font-medium text-amber-300">Página</span>
          <span class="font-bold text-white">${currentPage}</span>
          <span class="text-gray-400">de</span>
          <span class="font-medium">${totalPages}</span>
          <span class="hidden sm:inline text-gray-400">•</span>
          <span class="hidden sm:inline text-gray-300">${filteredMembers.length} miembros</span>
        `;
        if (prevButton) prevButton.disabled = currentPage <= 1;
        if (nextButton) nextButton.disabled = currentPage >= totalPages;
        
        if (prevButton) prevButton.onclick = () => { if (currentPage > 1) { currentPage--; updateTable(); updatePaginationInfo(); } };
        if (nextButton) nextButton.onclick = () => { if (currentPage < totalPages) { currentPage++; updateTable(); updatePaginationInfo(); } };
    }

    updateItemsPerPage();
    initTable();
}

// Ejecutar cuando el DOM esté listo
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initRosterTable);
}
