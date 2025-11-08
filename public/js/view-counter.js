// View counter functionality
function initViewCounter() {
  // Create the counter element
  const counterEl = document.createElement('div');
  counterEl.id = 'view-counter';
  counterEl.className = 'fixed bottom-4 right-4 bg-gray-800/80 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg shadow-lg border border-gray-700 z-50';
  counterEl.innerHTML = `
    <div class="flex items-center space-x-2">
      <span class="text-amber-400">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </span>
      <span>Loading...</span>
    </div>
  `;
  
  // Add to the page
  document.body.appendChild(counterEl);
  
  // Update the counter
  updateViewCounter();
}

// Update the view counter
async function updateViewCounter() {
  try {
    const response = await fetch('/.netlify/functions/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: window.location.pathname })
    });

    if (!response.ok) throw new Error('Failed to update counter');
    
    const data = await response.json();
    const counterEl = document.getElementById('view-counter');
    
    if (counterEl) {
      counterEl.innerHTML = `
        <div class="flex items-center space-x-2">
          <span class="text-amber-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </span>
          <span>Visitas: <span>${(data.views || 0).toLocaleString()}</span></span>
          <span class="text-gray-400">|</span>
          <span>Total: <span>${(data.totalViews || 0).toLocaleString()}</span></span>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error updating view counter:', error);
    const counterEl = document.getElementById('view-counter');
    if (counterEl) {
      counterEl.innerHTML = '<div class="text-amber-400">Error loading counter</div>';
    }
  }
}

// Initialize when the DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initViewCounter);
} else {
  initViewCounter();
}
