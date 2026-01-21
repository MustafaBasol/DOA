// Advanced Search & Filter System
class AdvancedSearch {
  constructor(entity) {
    this.entity = entity;
    this.filters = [];
    this.savedSearches = [];
    this.currentResults = null;
    this.entityFields = null;
  }

  // Initialize search
  async init() {
    await this.loadEntityFields();
    await this.loadSavedSearches();
    this.setupEventListeners();
    this.renderFilterBuilder();
  }

  // Load entity fields and operators
  async loadEntityFields() {
    try {
      const response = await fetch(`/api/search/fields/${this.entity}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error('Failed to load fields');

      this.entityFields = await response.json();
    } catch (error) {
      console.error('Load fields error:', error);
      this.showError('Alan bilgileri yüklenemedi');
    }
  }

  // Load saved searches
  async loadSavedSearches() {
    try {
      const response = await fetch(`/api/search/saved?entity=${this.entity}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error('Failed to load saved searches');

      this.savedSearches = await response.json();
      this.renderSavedSearches();
    } catch (error) {
      console.error('Load saved searches error:', error);
    }
  }

  // Setup event listeners
  setupEventListeners() {
    // Add filter button
    document.getElementById('addFilterBtn')?.addEventListener('click', () => {
      this.addFilter();
    });

    // Search button
    document.getElementById('searchBtn')?.addEventListener('click', () => {
      this.executeSearch();
    });

    // Clear filters button
    document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
      this.clearFilters();
    });

    // Save search button
    document.getElementById('saveSearchBtn')?.addEventListener('click', () => {
      this.showSaveSearchModal();
    });

    // Quick search input
    document.getElementById('quickSearchInput')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.quickSearch();
      }
    });

    // Quick search button
    document.getElementById('quickSearchBtn')?.addEventListener('click', () => {
      this.quickSearch();
    });
  }

  // Render filter builder
  renderFilterBuilder() {
    const container = document.getElementById('filterBuilder');
    if (!container) return;

    container.innerHTML = '';

    this.filters.forEach((filter, index) => {
      const filterRow = this.createFilterRow(filter, index);
      container.appendChild(filterRow);
    });

    // Add initial filter if none exist
    if (this.filters.length === 0) {
      this.addFilter();
    }
  }

  // Create filter row element
  createFilterRow(filter, index) {
    const row = document.createElement('div');
    row.className = 'filter-row';
    row.innerHTML = `
      <select class="filter-field" data-index="${index}">
        <option value="">Alan Seçin...</option>
        ${this.entityFields.fields.map(field => `
          <option value="${field.name}" ${filter.field === field.name ? 'selected' : ''}>
            ${field.label}
          </option>
        `).join('')}
      </select>
      
      <select class="filter-operator" data-index="${index}">
        <option value="">Operatör</option>
      </select>
      
      <input 
        type="text" 
        class="filter-value" 
        data-index="${index}" 
        placeholder="Değer"
        value="${filter.value || ''}"
      >
      
      <button class="btn-icon btn-danger" data-index="${index}" onclick="advancedSearch.removeFilter(${index})">
        <span>🗑️</span>
      </button>
    `;

    // Set up field change listener
    const fieldSelect = row.querySelector('.filter-field');
    fieldSelect.addEventListener('change', (e) => {
      this.onFieldChange(index, e.target.value);
    });

    // Set up operator change listener
    const operatorSelect = row.querySelector('.filter-operator');
    operatorSelect.addEventListener('change', (e) => {
      this.onOperatorChange(index, e.target.value);
    });

    // Set up value change listener
    const valueInput = row.querySelector('.filter-value');
    valueInput.addEventListener('input', (e) => {
      this.onValueChange(index, e.target.value);
    });

    // Populate operators if field is selected
    if (filter.field) {
      this.updateOperators(index, filter.field);
    }

    return row;
  }

  // Update operators based on field type
  updateOperators(index, fieldName) {
    const field = this.entityFields.fields.find(f => f.name === fieldName);
    if (!field) return;

    const operatorSelect = document.querySelector(`.filter-operator[data-index="${index}"]`);
    if (!operatorSelect) return;

    const applicableOperators = this.entityFields.operators.filter(op => 
      op.types.includes(field.type)
    );

    operatorSelect.innerHTML = `
      <option value="">Operatör Seçin...</option>
      ${applicableOperators.map(op => `
        <option value="${op.value}" ${this.filters[index]?.operator === op.value ? 'selected' : ''}>
          ${op.label}
        </option>
      `).join('')}
    `;

    // Update input type based on field type
    const valueInput = document.querySelector(`.filter-value[data-index="${index}"]`);
    if (valueInput) {
      switch (field.type) {
        case 'number':
          valueInput.type = 'number';
          break;
        case 'date':
          valueInput.type = 'date';
          break;
        case 'datetime':
          valueInput.type = 'datetime-local';
          break;
        case 'boolean':
          valueInput.type = 'checkbox';
          break;
        default:
          valueInput.type = 'text';
      }
    }
  }

  // Field change handler
  onFieldChange(index, fieldName) {
    this.filters[index] = this.filters[index] || {};
    this.filters[index].field = fieldName;
    this.filters[index].operator = '';
    this.filters[index].value = '';
    this.updateOperators(index, fieldName);
  }

  // Operator change handler
  onOperatorChange(index, operator) {
    this.filters[index] = this.filters[index] || {};
    this.filters[index].operator = operator;
  }

  // Value change handler
  onValueChange(index, value) {
    this.filters[index] = this.filters[index] || {};
    this.filters[index].value = value;
  }

  // Add new filter
  addFilter() {
    this.filters.push({ field: '', operator: '', value: '' });
    this.renderFilterBuilder();
  }

  // Remove filter
  removeFilter(index) {
    this.filters.splice(index, 1);
    this.renderFilterBuilder();
  }

  // Clear all filters
  clearFilters() {
    this.filters = [];
    this.renderFilterBuilder();
    this.currentResults = null;
    this.renderResults([]);
  }

  // Execute search
  async executeSearch(page = 1) {
    try {
      // Validate filters
      const validFilters = this.filters.filter(f => f.field && f.operator && f.value);

      if (validFilters.length === 0) {
        this.showError('Lütfen en az bir filtre ekleyin');
        return;
      }

      this.showLoading();

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          entity: this.entity,
          filters: validFilters,
          page,
          limit: 20
        })
      });

      if (!response.ok) throw new Error('Search failed');

      this.currentResults = await response.json();
      this.renderResults(this.currentResults.data);
      this.renderPagination(this.currentResults);
      this.hideLoading();
    } catch (error) {
      console.error('Search error:', error);
      this.showError('Arama başarısız oldu');
      this.hideLoading();
    }
  }

  // Quick search
  async quickSearch() {
    try {
      const query = document.getElementById('quickSearchInput')?.value;
      const field = document.getElementById('quickSearchField')?.value || 'all';

      if (!query) {
        this.showError('Lütfen arama terimi girin');
        return;
      }

      this.showLoading();

      const params = new URLSearchParams({
        entity: this.entity,
        q: query,
        field,
        page: '1',
        limit: '20'
      });

      const response = await fetch(`/api/search/quick?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error('Quick search failed');

      this.currentResults = await response.json();
      this.renderResults(this.currentResults.data);
      this.renderPagination(this.currentResults);
      this.hideLoading();
    } catch (error) {
      console.error('Quick search error:', error);
      this.showError('Hızlı arama başarısız oldu');
      this.hideLoading();
    }
  }

  // Render search results
  renderResults(data) {
    const container = document.getElementById('searchResults');
    if (!container) return;

    if (data.length === 0) {
      container.innerHTML = '<div class="no-results">Sonuç bulunamadı</div>';
      return;
    }

    const table = this.createResultsTable(data);
    container.innerHTML = '';
    container.appendChild(table);
  }

  // Create results table
  createResultsTable(data) {
    const table = document.createElement('table');
    table.className = 'results-table';

    // Generate headers based on data
    const headers = Object.keys(data[0]).filter(key => !key.startsWith('_') && typeof data[0][key] !== 'object');
    
    table.innerHTML = `
      <thead>
        <tr>
          ${headers.map(header => `<th>${this.formatHeader(header)}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${data.map(row => `
          <tr>
            ${headers.map(header => `<td>${this.formatCell(row[header])}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    `;

    return table;
  }

  // Format header text
  formatHeader(header) {
    return header
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  // Format cell value
  formatCell(value) {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? '✓' : '✗';
    if (value instanceof Date) return value.toLocaleString('tr-TR');
    if (typeof value === 'number') return value.toLocaleString('tr-TR');
    return value;
  }

  // Render pagination
  renderPagination(results) {
    const container = document.getElementById('searchPagination');
    if (!container) return;

    const { page, totalPages, total } = results;

    container.innerHTML = `
      <div class="pagination">
        <button 
          class="btn btn-secondary" 
          ${page === 1 ? 'disabled' : ''} 
          onclick="advancedSearch.executeSearch(${page - 1})">
          ← Önceki
        </button>
        <span class="pagination-info">
          Sayfa ${page} / ${totalPages} (Toplam: ${total})
        </span>
        <button 
          class="btn btn-secondary" 
          ${page === totalPages ? 'disabled' : ''} 
          onclick="advancedSearch.executeSearch(${page + 1})">
          Sonraki →
        </button>
      </div>
    `;
  }

  // Render saved searches
  renderSavedSearches() {
    const container = document.getElementById('savedSearchesList');
    if (!container) return;

    if (this.savedSearches.length === 0) {
      container.innerHTML = '<p class="no-saved">Kayıtlı arama yok</p>';
      return;
    }

    container.innerHTML = this.savedSearches.map(search => `
      <div class="saved-search-item">
        <div class="saved-search-info">
          <strong>${search.name}</strong>
          ${search.isDefault ? '<span class="badge">Varsayılan</span>' : ''}
          ${search.description ? `<p class="text-sm">${search.description}</p>` : ''}
        </div>
        <div class="saved-search-actions">
          <button class="btn btn-sm btn-primary" onclick="advancedSearch.loadSavedSearch('${search.id}')">
            Yükle
          </button>
          <button class="btn btn-sm btn-secondary" onclick="advancedSearch.executeSavedSearch('${search.id}')">
            Çalıştır
          </button>
          <button class="btn btn-sm btn-danger" onclick="advancedSearch.deleteSavedSearch('${search.id}')">
            Sil
          </button>
        </div>
      </div>
    `).join('');
  }

  // Save search modal
  showSaveSearchModal() {
    const validFilters = this.filters.filter(f => f.field && f.operator && f.value);

    if (validFilters.length === 0) {
      this.showError('Kaydetmek için en az bir filtre ekleyin');
      return;
    }

    const name = prompt('Arama adı:');
    if (!name) return;

    const description = prompt('Açıklama (opsiyonel):');
    const isDefault = confirm('Varsayılan arama olarak ayarla?');

    this.saveSavedSearch({ name, description, isDefault, filters: validFilters });
  }

  // Save search
  async saveSavedSearch(data) {
    try {
      const response = await fetch('/api/search/saved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...data,
          entity: this.entity
        })
      });

      if (!response.ok) throw new Error('Save failed');

      alert('Arama başarıyla kaydedildi');
      await this.loadSavedSearches();
    } catch (error) {
      console.error('Save error:', error);
      this.showError('Arama kaydedilemedi');
    }
  }

  // Load saved search
  async loadSavedSearch(id) {
    try {
      const response = await fetch(`/api/search/saved/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error('Load failed');

      const savedSearch = await response.json();
      this.filters = savedSearch.filters;
      this.renderFilterBuilder();
    } catch (error) {
      console.error('Load saved search error:', error);
      this.showError('Arama yüklenemedi');
    }
  }

  // Execute saved search
  async executeSavedSearch(id) {
    try {
      this.showLoading();

      const response = await fetch(`/api/search/saved/${id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ page: 1, limit: 20 })
      });

      if (!response.ok) throw new Error('Execute failed');

      this.currentResults = await response.json();
      this.renderResults(this.currentResults.data);
      this.renderPagination(this.currentResults);
      this.hideLoading();
    } catch (error) {
      console.error('Execute saved search error:', error);
      this.showError('Arama çalıştırılamadı');
      this.hideLoading();
    }
  }

  // Delete saved search
  async deleteSavedSearch(id) {
    if (!confirm('Bu aramayı silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/search/saved/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error('Delete failed');

      alert('Arama silindi');
      await this.loadSavedSearches();
    } catch (error) {
      console.error('Delete error:', error);
      this.showError('Arama silinemedi');
    }
  }

  // Show loading
  showLoading() {
    document.getElementById('searchLoading')?.classList.remove('hidden');
  }

  // Hide loading
  hideLoading() {
    document.getElementById('searchLoading')?.classList.add('hidden');
  }

  // Show error
  showError(message) {
    alert(message);
  }
}

// Global instance
let advancedSearch = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const entity = document.getElementById('searchContainer')?.dataset.entity;
  if (entity) {
    advancedSearch = new AdvancedSearch(entity);
    advancedSearch.init();
  }
});

export default AdvancedSearch;
