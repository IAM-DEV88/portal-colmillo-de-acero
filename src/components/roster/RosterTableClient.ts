// RosterTableClient.ts - Lógica del cliente para el componente RosterTable
// Restaurado para soportar el estilo y distribución del commit 10856bfac457b24c38a64b14f8a5ab6ec7277bc8.

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
    let itemsPerPage = 9; 
    let allMembers = [];
    let filteredMembers = [];
    let sortConfig = { key: 'name', direction: 'asc' };

    // Modal elements
    const modal = document.getElementById('member-modal');
    const closeModalX = document.getElementById('close-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');

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
            const dateRange = recs.length > 1 
              ? `${recs[recs.length - 1].dateStr} - ${firstRec.dateStr}`
              : firstRec.dateStr;

            html += `
              <div class="bg-gray-800/40 p-2 rounded-md border border-amber-600/20 hover:border-amber-500/40 transition-colors text-sm">
                <div class="flex justify-between items-center">
                  <span class="font-medium text-amber-300">${title}</span>
                  <span class="text-xs text-gray-400 bg-gray-700/50 px-1.5 py-0.5 rounded">${recs.length}x</span>
                </div>
                <div class="flex justify-between items-center mt-1">
                  <span class="text-xs text-gray-400">${dateRange}</span>
                  ${firstRec.achievement ? `
                    <span class="text-xs text-amber-200/70 flex items-center gap-1">
                      <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      ${firstRec.achievement}
                    </span>
                  ` : ''}
                </div>
              </div>
            `;
          });
          html += '</div>';
        } else {
          html = '<div class="text-center py-3"><p class="text-sm text-gray-400">No hay reconocimientos registrados</p></div>';
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
          html += '<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">';
          allCores.forEach(core => {
            // Determine day for URL
            let dayParam = '';
            if (core.schedule) {
              const parts = core.schedule.split(' ');
              if (parts.length > 0) {
                dayParam = parts[0].toLowerCase()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '');
              }
            }
            
            const raidUrl = `/raids?raid-id=${encodeURIComponent(core.raid)}&day=${encodeURIComponent(dayParam)}`;

            html += `
              <a href="${raidUrl}" class="block group bg-gray-800/40 p-3 rounded-md border border-amber-600/20 hover:border-amber-500/40 hover:bg-gray-800/60 transition-all duration-200">
                <div class="flex flex-col mb-1">
                  <span class="font-bold text-amber-300 text-sm group-hover:text-amber-200 transition-colors">${core.raid}</span>
                </div>
                <div class="flex items-center gap-2 mt-1 text-xs text-gray-300 group-hover:text-gray-200">
                  <svg class="w-3.5 h-3.5 text-amber-500/70 group-hover:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>${core.schedule}</span>
                </div>
              </a>
            `;
          });
          html += '</div>';
        } else {
          html = '<div class="text-center py-6"><p class="text-sm text-gray-500 italic">No hay registros de participación en raids</p></div>';
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

    // Open modal
    (window as any).openMemberModal = function(memberData) {
        if (!modal) return;
        
        let member;
        if (typeof memberData === 'string') {
          // Find member by name in allMembers
          member = allMembers.find(m => m.name === memberData);
        } else {
          // memberData is already an object
          member = memberData;
        }

        if (!member) {
          console.error('No se pudo encontrar la información del miembro:', memberData);
          return;
        }

        const modalName = document.getElementById('modal-character-name');
        const modalRank = document.getElementById('modal-header-rank');
        const modalNote = document.getElementById('modal-note');
        const modalTags = document.getElementById('modal-tags');
        const modalClassIcon = document.getElementById('modal-class-icon');

        if (modalName) modalName.textContent = member.name;
        
        if (modalRank) {
          modalRank.textContent = member.rank;
        }

        if (modalClassIcon) {
          const classData = rosterInfo.classInfo[member.class] || { color: 'FFFFFF', name: member.class };
          modalClassIcon.innerHTML = `
            <div class="relative flex-shrink-0">
              <img src="/images/avatars/class_${classData.name}.jpg" class="w-12 h-12 rounded-md shadow-lg border border-gray-700/50 object-cover" onerror="this.src='/images/avatars/default.png'" />
              <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-md border-2 border-gray-900" style="background-color: #${classData.color}"></div>
            </div>
          `;
          
          if (modalName) modalName.style.color = `#${classData.color}`;
        }

        if (modalNote) modalNote.textContent = member.publicNote || 'Sin nota pública';

        // Update tags
        if (modalTags) {
          modalTags.innerHTML = '';
          let formattedInfo = [];

          if (member.faction) {
            const factionCode = member.faction;
            formattedInfo.push({
              label: (factionCode === '1' ? '🛡️ ' : '⚔️ ') + (factionNamesData[factionCode] || ''),
              class: factionCode === '1' ? 'bg-blue-500/10 border-blue-500/40 text-blue-300' : 'bg-red-500/10 border-red-500/40 text-red-300',
            });
          }

          if (member.race) {
            const raceColors = {
              GN: 'bg-pink-500/10 border-pink-500/40 text-pink-300',
              HU: 'bg-blue-500/10 border-blue-500/40 text-blue-300',
              NE: 'bg-purple-500/10 border-purple-500/40 text-purple-300',
              DW: 'bg-amber-500/10 border-amber-500/40 text-amber-300',
              DR: 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300',
              OR: 'bg-green-500/10 border-green-500/40 text-green-300',
              TA: 'bg-yellow-500/10 border-yellow-500/40 text-yellow-300',
              UN: 'bg-gray-500/10 border-gray-500/40 text-gray-300',
              TR: 'bg-orange-500/10 border-orange-500/40 text-orange-300',
              BE: 'bg-red-500/10 border-red-500/40 text-red-300',
            };
            formattedInfo.push({
              label: raceNamesData[member.race] || member.race,
              class: raceColors[member.race] || 'bg-gray-500/10 border-gray-500/40 text-gray-300',
            });
          }

          const nv = member.noteValidation;
          if (nv) {
            if (nv.mainAlt) {
              formattedInfo.push({
                label: nv.mainAlt === 'M' ? 'Main' : 'Alt',
                class: nv.mainAlt === 'M' ? 'bg-blue-500/10 border-blue-500/40 text-blue-300 hover:bg-blue-500/20 transition-all' : 'bg-purple-500/10 border-purple-500/40 text-purple-300 hover:bg-purple-500/20 transition-all',
              });
            }
            if (nv.role) {
              const roleName = roleNamesData[nv.role]?.name || nv.role;
              formattedInfo.push({
                label: roleName,
                class: nv.role === 'T' ? 'bg-blue-500/10 border-blue-500/40 text-blue-200 hover:bg-blue-500/20 transition-all' : nv.role === 'H' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/20 transition-all' : 'bg-rose-500/10 border-rose-500/40 text-rose-200 hover:bg-rose-500/20 transition-all',
              });
            }
            if (nv.gearScore) {
              formattedInfo.push({
                label: `GS ${nv.gearScore}k`,
                class: 'bg-amber-500/10 border-amber-500/40 text-amber-200 hover:bg-amber-500/20 transition-all',
              });
            }
            
            // Dual Role support
            if (nv.dualRole && nv.dualRole !== nv.role) {
              const dualRoleName = roleNamesData[nv.dualRole]?.name || nv.dualRole;
              formattedInfo.push({
                label: `Dual ${dualRoleName}`,
                class: 'bg-yellow-500/10 border-yellow-500/40 text-yellow-200 hover:bg-yellow-500/20 transition-all',
              });
              if (nv.dualGearScore) {
                formattedInfo.push({
                  label: `GS ${nv.dualGearScore}k`,
                  class: 'bg-amber-500/10 border-amber-500/40 text-amber-200 hover:bg-amber-500/20 transition-all',
                });
              }
            }

            if (nv.professions && nv.professions.length > 0) {
              // Ensure unique professions using Set
              const uniqueProfs = [...new Set(nv.professions)];
              uniqueProfs.forEach(profCode => {
                const prof = professionNamesData[profCode] || { name: profCode };
                formattedInfo.push({
                  label: prof.name,
                  class: 'bg-indigo-500/10 border-indigo-500/40 text-indigo-200 hover:bg-indigo-500/20 transition-all',
                });
              });
            }
          }

          formattedInfo.forEach(tag => {
            const span = document.createElement('span');
            span.className = `inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${tag.class}`;
            span.textContent = tag.label;
            modalTags.appendChild(span);
          });
        }

        updateRecognitionsDisplay(member);
        updateRaidsDisplay(member);
        
        // Reset tab to general (using Alpine.js internal state)
        if ((modal as any)?.__x?.$data) {
          (modal as any).__x.$data.activeTab = 'general';
        }
        
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('show'), 10);
        document.body.style.overflow = 'hidden';
    };

    if (closeModalX) closeModalX.onclick = () => {
        modal?.classList.remove('show');
        setTimeout(() => modal?.classList.add('hidden'), 200);
        document.body.style.overflow = '';
    };

    if (modalBackdrop) modalBackdrop.onclick = () => {
        modal?.classList.remove('show');
        setTimeout(() => modal?.classList.add('hidden'), 200);
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

            // Update button styles
            sortButtons.forEach(btn => {
              btn.classList.remove('bg-amber-900/50', 'border-amber-500/50');
              btn.classList.add('bg-amber-900/30', 'border-amber-700/50');
              const indicator = btn.querySelector('.sort-indicator');
              if (indicator) indicator.textContent = '↑';
            });

            button.classList.remove('bg-amber-900/30', 'border-amber-700/50');
            button.classList.add('bg-amber-900/50', 'border-amber-500/50');
            const indicator = button.querySelector('.sort-indicator');
            if (indicator) indicator.textContent = sortConfig.direction === 'asc' ? '↑' : '↓';

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
                   onclick="window.openMemberModal('${member.name.replace(/'/g, "\\'")}')">
                <div class="absolute top-0 left-0 w-1 h-full opacity-50" style="background-color: #${classData.color};"></div>
                <div class="absolute top-1 right-1 flex flex-col gap-0.5 sm:flex-row sm:gap-1 z-10">
                  ${raidCount > 0 ? `<div class="px-1.5 py-0.5 rounded text-[9px] sm:text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1" title="${raidCount} Raids Activas"><span>${raidCount}</span></div>` : ''}
                  ${recCount > 0 ? `<div class="px-1.5 py-0.5 rounded text-[9px] sm:text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1" title="${recCount} Reconocimientos"><span>${recCount}</span></div>` : ''}
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
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRosterTable);
  } else {
    initRosterTable();
  }
}
