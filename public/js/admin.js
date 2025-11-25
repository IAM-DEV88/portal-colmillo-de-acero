document.addEventListener('DOMContentLoaded', () => {
  // Function to update all status-related UI elements
  function updateStatusButtons(container, newStatus) {
    // Format status for display (capitalize first letter, replace underscores with spaces)
    const formattedStatus = newStatus
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    
    // Get the raid group container
    const raidGroup = container.closest('.raid-group');
    
    // Update all status badges in the card
    container.querySelectorAll('.status-badge').forEach(statusBadge => {
      if (statusBadge) {
        // Update classes based on status
        statusBadge.className = `status-badge px-2.5 py-1 text-xs font-semibold rounded-full shadow-md ${
          newStatus === 'aceptado' ? 'bg-gradient-to-r from-green-600/90 to-green-700/90 text-green-100' : 
          newStatus === 'en_espera' ? 'bg-gradient-to-r from-amber-600/90 to-amber-700/90 text-amber-100' : 
          'bg-gradient-to-r from-blue-600/90 to-blue-700/90 text-blue-100'
        }`;
        // Update text content
        statusBadge.textContent = formattedStatus;
      }
    });
    
    // Update any status text elements (if they exist)
    container.querySelectorAll('.status-text').forEach(el => {
      el.textContent = formattedStatus;
      // Update text color based on status
      el.className = `status-text ${
        newStatus === 'aceptado' ? 'text-green-300' : 
        newStatus === 'en_espera' ? 'text-amber-300' : 'text-blue-300'
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
        en_espera: 0
      };
      
      registrationCards.forEach(card => {
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
    statusButtons.forEach(btn => {
      const status = btn.getAttribute('data-status');
      const isActive = status === newStatus;
      
      // Update button classes based on active state
      if (isActive) {
        btn.classList.add(
          status === 'aceptado' ? 'bg-green-600/20' : 
          status === 'en_espera' ? 'bg-amber-600/20' : 'bg-blue-600/20',
          status === 'aceptado' ? 'text-green-300' : 
          status === 'en_espera' ? 'text-amber-300' : 'text-blue-300'
        );
        btn.classList.remove(
          status === 'aceptado' ? 'hover:bg-green-900/40' : 
          status === 'en_espera' ? 'hover:bg-amber-900/40' : 'hover:bg-blue-900/40',
          status === 'aceptado' ? 'text-green-400' : 
          status === 'en_espera' ? 'text-amber-400' : 'text-blue-400',
          status === 'aceptado' ? 'hover:text-green-300' : 
          status === 'en_espera' ? 'hover:text-amber-300' : 'hover:text-blue-300'
        );
        btn.disabled = true;
      } else {
        btn.classList.remove(
          status === 'aceptado' ? 'bg-green-600/20' : 
          status === 'en_espera' ? 'bg-amber-600/20' : 'bg-blue-600/20',
          status === 'aceptado' ? 'text-green-300' : 
          status === 'en_espera' ? 'text-amber-300' : 'text-blue-300'
        );
        btn.classList.add(
          status === 'aceptado' ? 'hover:bg-green-900/40' : 
          status === 'en_espera' ? 'hover:bg-amber-900/40' : 'hover:bg-blue-900/40',
          status === 'aceptado' ? 'text-green-400' : 
          status === 'en_espera' ? 'text-amber-400' : 'text-blue-400',
          status === 'aceptado' ? 'hover:text-green-300' : 
          status === 'en_espera' ? 'hover:text-amber-300' : 'hover:text-blue-300'
        );
        btn.disabled = false;
      }
    });
  }

  // Handle status update forms
  document.querySelectorAll('form[action$="/update-status"]').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const button = form.querySelector('button[type="submit"]');
      const originalText = button.innerHTML;
      const newStatus = formData.get('status');
      const card = form.closest('.registration-card');
      
      try {
        // Show loading state
        button.disabled = true;
        button.innerHTML = `
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Actualizando...
        `;

        // Update UI optimistically before the request completes
        updateStatusButtons(card, newStatus);
        
        const response = await fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });

        const data = await response.json();
        
        if (!response.ok || !data.success) {
          // Revert UI if request fails
          const currentStatus = card.querySelector('.status-badge').textContent.toLowerCase();
          updateStatusButtons(card, currentStatus);
          throw new Error(data.error || 'Error al actualizar el estado');
        }
        
        // Update the status badge with server response
        if (data.status) {
          updateStatusButtons(card, data.status);
        }
        
        // Show success message from server or default
        showToast(data.message || 'Estado actualizado correctamente', 'success');
        
      } catch (error) {
        console.error('Error:', error);
        showToast('Error al actualizar el estado', 'error');
      } finally {
        // Reset button state
        button.disabled = false;
        button.innerHTML = originalText;
      }
    });
  });

  // Handle delete forms
  document.querySelectorAll('form[action$="/delete"] button[type="button"]').forEach(button => {
    button.addEventListener('click', () => {
      if (confirm('¿Estás seguro de que deseas eliminar esta solicitud? Esta acción no se puede deshacer.')) {
        const form = button.closest('form');
        handleDelete(form);
      }
    });
  });

  async function handleDelete(form) {
    const button = form.querySelector('button[type="button"]');
    const originalText = button.innerHTML;
    const card = form.closest('.registration-card');
    
    try {
      // Show loading state
      button.disabled = true;
      button.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Eliminando...
      `;

      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Error al eliminar la solicitud');
      
      // Remove the card with animation
      card.style.opacity = '0';
      card.style.transform = 'translateX(100%)';
      card.style.transition = 'all 0.3s ease-in-out';
      
      setTimeout(() => {
        card.remove();
        showToast('Solicitud eliminada correctamente', 'success');
        
        // Check if there are no more registrations
        const raidGroup = card.closest('.raid-group');
        const raidCards = raidGroup.querySelectorAll('.registration-card');
        if (raidCards.length === 1) { // The current card is the last one
          const raidContainer = raidGroup.closest('.bg-gradient-to-br');
          const noRegistrations = document.createElement('div');
          noRegistrations.className = 'text-center py-12';
          noRegistrations.innerHTML = '<p class="text-gray-400">No hay solicitudes para mostrar</p>';
          
          raidContainer.parentNode.replaceChild(noRegistrations, raidContainer);
        }
      }, 300);
      
    } catch (error) {
      console.error('Error:', error);
      showToast('Error al eliminar la solicitud', 'error');
    } finally {
      button.disabled = false;
      button.innerHTML = originalText;
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
});
