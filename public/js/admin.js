document.addEventListener('DOMContentLoaded', () => {
  // Function to update dashboard statistics
  function updateDashboardStats() {
    // Count all rows across all tables
    const allRows = document.querySelectorAll('details table tbody tr');
    const stats = {
      total: allRows.length,
      en_revision: 0,
      aceptado: 0,
      en_espera: 0,
    };

    allRows.forEach((row) => {
      const statusBadge = row.querySelector('td:nth-child(5) span');
      if (statusBadge) {
        const statusText = statusBadge.textContent.toLowerCase().trim();
        if (statusText.includes('revisión') || statusText.includes('revision')) {
          stats.en_revision++;
        } else if (statusText.includes('aceptado')) {
          stats.aceptado++;
        } else if (statusText.includes('espera')) {
          stats.en_espera++;
        }
      }
    });

    // Update dashboard cards - find all stat cards by their structure
    const allStatCards = document.querySelectorAll('.text-3xl.font-bold');

    allStatCards.forEach((valueElement) => {
      const card = valueElement.closest('div');
      if (!card) return;

      const label = card.querySelector('.text-sm');
      if (!label) return;

      const labelText = label.textContent.toLowerCase().trim();

      if (labelText.includes('total')) {
        valueElement.textContent = stats.total;
      } else if (labelText.includes('revisión') || labelText.includes('revision')) {
        valueElement.textContent = stats.en_revision;
      } else if (labelText.includes('aceptado')) {
        valueElement.textContent = stats.aceptado;
      } else if (labelText.includes('espera')) {
        valueElement.textContent = stats.en_espera;
      }
    });
  }

  // Function to update button states in a row
  function updateButtonStates(row, currentStatus) {
    const actionButtons = row.querySelectorAll(
      'form[action$="/update-status"] button[type="submit"]'
    );

    actionButtons.forEach((btn) => {
      const form = btn.closest('form');
      const btnStatus = form?.querySelector('input[name="status"]')?.value;

      if (btnStatus === currentStatus) {
        // Disable and style as active
        btn.disabled = true;
        btn.classList.remove(
          'hover:bg-green-900/30',
          'hover:bg-amber-900/30',
          'hover:bg-blue-900/30',
          'hover:text-green-300',
          'hover:text-amber-300',
          'hover:text-blue-300'
        );
        btn.classList.add('cursor-not-allowed', 'text-gray-600');
      } else {
        // Enable and restore hover styles
        btn.disabled = false;
        btn.classList.remove('cursor-not-allowed', 'text-gray-600');

        if (btnStatus === 'aceptado') {
          btn.classList.add('text-green-400', 'hover:bg-green-900/30', 'hover:text-green-300');
        } else if (btnStatus === 'en_espera') {
          btn.classList.add('text-amber-400', 'hover:bg-amber-900/30', 'hover:text-amber-300');
        } else if (btnStatus === 'en_revision') {
          btn.classList.add('text-blue-400', 'hover:bg-blue-900/30', 'hover:text-blue-300');
        }
      }
    });
  }

  // Function to update all status-related UI elements
  function updateStatusButtons(container, newStatus) {
    if (!container) return;

    // Format status for display (capitalize first letter, replace underscores with spaces)
    const formattedStatus = newStatus.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

    // Get the raid group container
    const raidGroup = container.closest('.raid-group');

    // Update all status badges in the card
    container.querySelectorAll('.status-badge').forEach((statusBadge) => {
      if (statusBadge) {
        // Update classes based on status
        statusBadge.className = `status-badge px-2.5 py-1 text-xs font-semibold rounded-full shadow-md ${
          newStatus === 'aceptado'
            ? 'bg-gradient-to-r from-green-600/90 to-green-700/90 text-green-100'
            : newStatus === 'en_espera'
              ? 'bg-gradient-to-r from-amber-600/90 to-amber-700/90 text-amber-100'
              : 'bg-gradient-to-r from-blue-600/90 to-blue-700/90 text-blue-100'
        }`;
        // Update text content
        statusBadge.textContent = formattedStatus;
      }
    });

    // Update any status text elements (if they exist)
    container.querySelectorAll('.status-text').forEach((el) => {
      el.textContent = formattedStatus;
      // Update text color based on status
      el.className = `status-text ${
        newStatus === 'aceptado'
          ? 'text-green-300'
          : newStatus === 'en_espera'
            ? 'text-amber-300'
            : 'text-blue-300'
      }`;
    });

    // Update raid group status counts if we're in a raid group
    if (raidGroup) {
      // Get all registration cards in this raid group
      const registrationCards = raidGroup.querySelectorAll('.registration-card');

      // Count statuses
      const statusCounts = {
        en_revision: 0,
        aceptado: 0,
        en_espera: 0,
      };

      registrationCards.forEach((card) => {
        const statusBadge = card.querySelector('.status-badge');
        if (statusBadge) {
          const status = statusBadge.textContent.trim().toLowerCase().replace(/ /g, '_');
          if (status in statusCounts) {
            statusCounts[status]++;
          }
        }
      });

      // Update the status count badges in the raid group header
      const updateStatusBadge = (status, count) => {
        const badge = raidGroup.querySelector(`.status-count-${status}`);
        if (badge) {
          badge.textContent = `${count} ${status === 'en_revision' ? 'Revisión' : status === 'aceptado' ? 'Aceptado' : 'En espera'}`;

          // Update the progress bar width
          const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
          const progressBar = raidGroup.querySelector('.progress-bar-fill');
          if (progressBar) {
            progressBar.style.width = `${(statusCounts.aceptado / Math.max(1, total)) * 100}%`;
          }
        }
      };

      // Update each status count
      updateStatusBadge('en_revision', statusCounts.en_revision);
      updateStatusBadge('aceptado', statusCounts.aceptado);
      updateStatusBadge('en_espera', statusCounts.en_espera);
    }

    // Update all status buttons in this card
    const statusButtons = container.querySelectorAll('[data-status]');
    statusButtons.forEach((btn) => {
      const status = btn.getAttribute('data-status');
      const isActive = status === newStatus;

      // Update button classes based on active state
      if (isActive) {
        btn.classList.add(
          status === 'aceptado'
            ? 'bg-green-600/20'
            : status === 'en_espera'
              ? 'bg-amber-600/20'
              : 'bg-blue-600/20',
          status === 'aceptado'
            ? 'text-green-300'
            : status === 'en_espera'
              ? 'text-amber-300'
              : 'text-blue-300'
        );
        btn.classList.remove(
          status === 'aceptado'
            ? 'hover:bg-green-900/40'
            : status === 'en_espera'
              ? 'hover:bg-amber-900/40'
              : 'hover:bg-blue-900/40',
          status === 'aceptado'
            ? 'text-green-400'
            : status === 'en_espera'
              ? 'text-amber-400'
              : 'text-blue-400',
          status === 'aceptado'
            ? 'hover:text-green-300'
            : status === 'en_espera'
              ? 'hover:text-amber-300'
              : 'hover:text-blue-300'
        );
        btn.disabled = true;
      } else {
        btn.classList.remove(
          status === 'aceptado'
            ? 'bg-green-600/20'
            : status === 'en_espera'
              ? 'bg-amber-600/20'
              : 'bg-blue-600/20',
          status === 'aceptado'
            ? 'text-green-300'
            : status === 'en_espera'
              ? 'text-amber-300'
              : 'text-blue-300'
        );
        btn.classList.add(
          status === 'aceptado'
            ? 'hover:bg-green-900/40'
            : status === 'en_espera'
              ? 'hover:bg-amber-900/40'
              : 'hover:bg-blue-900/40',
          status === 'aceptado'
            ? 'text-green-400'
            : status === 'en_espera'
              ? 'text-amber-400'
              : 'text-blue-400',
          status === 'aceptado'
            ? 'hover:text-green-300'
            : status === 'en_espera'
              ? 'hover:text-amber-300'
              : 'hover:text-blue-300'
        );
        btn.disabled = false;
      }
    });
  }

  // Handle status update forms
  document.querySelectorAll('form[action$="/update-status"]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const button = form.querySelector('button[type="submit"]');
      const originalHTML = button.innerHTML;
      const newStatus = formData.get('status');
      const row = form.closest('tr');

      if (!row) {
        console.error('Could not find table row');
        return;
      }

      try {
        // Show loading state
        button.disabled = true;
        button.innerHTML = `
          <svg class="animate-spin h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        `;

        const response = await fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: {
            Accept: 'application/json',
          },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Error al actualizar el estado');
        }

        // Update the status badge in the row
        const statusCell = row.querySelector('td:nth-child(5)');
        if (statusCell) {
          const statusBadge = statusCell.querySelector('span');
          if (statusBadge) {
            // Update badge classes and text with animation
            statusBadge.style.transition = 'all 0.3s ease';
            statusBadge.style.transform = 'scale(1.1)';

            setTimeout(() => {
              statusBadge.className = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                newStatus === 'aceptado'
                  ? 'bg-green-900/20 text-green-400 border-green-700/30'
                  : newStatus === 'en_espera'
                    ? 'bg-amber-900/20 text-amber-400 border-amber-700/30'
                    : 'bg-blue-900/20 text-blue-400 border-blue-700/30'
              }`;
              statusBadge.textContent =
                newStatus === 'en_revision'
                  ? 'Revisión'
                  : newStatus === 'aceptado'
                    ? 'Aceptado'
                    : newStatus === 'en_espera'
                      ? 'En Espera'
                      : newStatus;

              statusBadge.style.transform = 'scale(1)';
            }, 150);
          }
        }

        // Update button states in this row
        updateStatusButtons(row, newStatus);

        // Update dashboard statistics
        updateDashboardStats();

        // Add visual feedback to the row
        row.style.transition = 'background-color 0.5s ease';
        row.style.backgroundColor = 'rgba(34, 197, 94, 0.1)'; // Green flash
        setTimeout(() => {
          row.style.backgroundColor = '';
        }, 1000);

        showToast(data.message || 'Estado actualizado correctamente', 'success');
      } catch (error) {
        console.error('Error:', error);
        showToast(error.message || 'Error al actualizar el estado', 'error');
      } finally {
        // Reset button state
        button.disabled = false;
        button.innerHTML = originalHTML;
      }
    });
  });

  // Handle delete forms
  document.querySelectorAll('form[action$="/delete"]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      handleDelete(form);
    });
  });

  async function handleDelete(form) {
    const button = form.querySelector('button[type="submit"]');
    const originalHTML = button.innerHTML;
    const row = form.closest('tr');

    if (!row) {
      console.error('Could not find table row');
      return;
    }

    try {
      // Show loading state
      button.disabled = true;
      button.innerHTML = `
        <svg class="animate-spin h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      `;

      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) throw new Error('Error al eliminar la solicitud');

      // Remove the row with animation
      row.style.opacity = '0';
      row.style.transform = 'translateX(100%)';
      row.style.transition = 'all 0.3s ease-in-out';

      setTimeout(() => {
        row.remove();

        // Update dashboard statistics after deletion
        updateDashboardStats();

        showToast('Solicitud eliminada correctamente', 'success');

        // Check if there are no more rows in the table
        const table = form.closest('table');
        const tbody = table?.querySelector('tbody');
        const remainingRows = tbody?.querySelectorAll('tr');

        if (remainingRows && remainingRows.length === 0) {
          // Hide the table and show empty message
          const tableContainer = table.closest('.overflow-x-auto');
          if (tableContainer) {
            tableContainer.innerHTML =
              '<div class="text-center py-8 text-gray-400">No hay solicitudes para este raid</div>';
          }
        }
      }, 300);
    } catch (error) {
      console.error('Error:', error);
      showToast('Error al eliminar la solicitud', 'error');
      button.disabled = false;
      button.innerHTML = originalHTML;
    }
  }

  // Show toast notification
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    } text-white flex items-center space-x-2 z-50 animate-fade-in`;

    toast.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Remove toast after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      toast.style.transition = 'all 0.3s ease-in-out';

      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

  // Edit Modal Functions
  window.openEditModal = function (registration) {
    const modal = document.getElementById('edit-modal');
    const form = document.getElementById('edit-form');

    if (!modal || !form) return;

    // Normalize class to match select options (lowercase)
    const normalizeClass = (className) => {
      if (!className) return 'warrior';
      return className.toLowerCase();
    };

    // Normalize day_of_week to match select options (capitalize first letter)
    const normalizeDay = (day) => {
      if (!day) return '';
      const normalized = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
      // Handle special cases for Spanish days
      const daysMap = {
        Lunes: 'Lunes',
        Martes: 'Martes',
        Miercoles: 'Miercoles',
        Jueves: 'Jueves',
        Viernes: 'Viernes',
        Sabado: 'Sabado',
        Domingo: 'Domingo',
      };
      return daysMap[normalized] || '';
    };

    try {
      // Populate form fields
      document.getElementById('edit-id').value = registration.id;
      document.getElementById('edit-player-name').value = registration.player_name || '';

      // Set the status field if it exists
      const statusField = document.getElementById('edit-status');
      if (statusField) {
        statusField.value = registration.status || 'aceptado';
      }

      // Set player class with normalization
      const playerClass = normalizeClass(registration.player_class);
      const classSelect = document.getElementById('edit-player-class');
      if (classSelect) {
        classSelect.value = playerClass;
      }

      document.getElementById('edit-player-role').value = registration.player_role || 'tank';

      // Set day with normalization
      const daySelect = document.getElementById('edit-day');
      if (daySelect) {
        const normalizedDay = normalizeDay(registration.day_of_week);
        daySelect.value = normalizedDay;
      }

      document.getElementById('edit-time').value = registration.start_time || '';
      document.getElementById('edit-raid-role').value = registration.raid_role || 'asistente';

      // Show modal
      modal.classList.remove('hidden');
    } catch (error) {
      console.error('Error in openEditModal:', error);
    }
  };

  window.closeEditModal = function () {
    const modal = document.getElementById('edit-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  };

  // Handle edit form submission
  const editForm = document.getElementById('edit-form');
  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(editForm);
      const submitButton = editForm.querySelector('button[type="submit"]');
      const originalHTML = submitButton.innerHTML;

      try {
        submitButton.disabled = true;
        submitButton.innerHTML = `
          <svg class="animate-spin h-4 w-4 text-white inline mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Guardando...
        `;

        // Convert FormData to JSON object
        const formData = new FormData(editForm);
        const jsonData = Object.fromEntries(formData.entries());

        const response = await fetch(editForm.action, {
          method: 'POST',
          body: JSON.stringify(jsonData),
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Error al actualizar el registro');
        }

        showToast('Registro actualizado correctamente', 'success');
        closeEditModal();

        // Reload page to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        console.error('Error:', error);
        showToast(error.message || 'Error al actualizar el registro', 'error');
      } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalHTML;
      }
    });
  }

  // Close modal when clicking outside
  const editModal = document.getElementById('edit-modal');
  if (editModal) {
    editModal.addEventListener('click', (e) => {
      if (e.target === editModal) {
        closeEditModal();
      }
    });
  }
});
