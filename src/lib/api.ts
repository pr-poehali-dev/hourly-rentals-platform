const API_URLS = {
  adminAuth: 'https://functions.poehali.dev/f446518c-113b-41ed-8bdc-17ef6babda08',
  adminListings: 'https://functions.poehali.dev/5dea57de-4652-4870-b39f-6b34e594bc21',
  adminUpload: 'https://functions.poehali.dev/22c1da70-b8a6-4b5e-81b8-330b559a8943',
  adminOwners: 'https://functions.poehali.dev/25475092-b74f-493d-a43c-082847302085',
  ownerListings: 'https://functions.poehali.dev/f431775b-031f-4417-b3eb-9e0475119162',
  publicListings: 'https://functions.poehali.dev/38a2f104-026e-40ea-80dc-0c07c014f868',
  ownerAuth: 'https://functions.poehali.dev/381f57fd-5365-49e9-bb38-088d8db34102',
  ownerPasswordRecovery: 'https://functions.poehali.dev/e8d34dd8-8e0d-4d25-b36b-499898e019c7',
  auction: 'https://functions.poehali.dev/8e5ad1a2-e9bb-462c-baba-212ad26ae9a7',
  statistics: 'https://functions.poehali.dev/0b408e53-8bd4-4f19-a1b5-9403bb03cffd',
  payment: 'https://functions.poehali.dev/d3177c56-4fe4-4a52-a878-e17cca7a1397',
  ownerTransactions: 'https://functions.poehali.dev/d65e7c1b-75b3-4a33-965b-70ee3a543a50',
};

export const api = {
  // Авторизация
  login: async (login: string, password: string) => {
    try {
      const response = await fetch(API_URLS.adminAuth, {
        method: 'POST',
        mode: 'cors',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email: login, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Получение списка объектов (для админа)
  getListings: async (token: string, showArchived = false) => {
    const url = showArchived 
      ? `${API_URLS.adminListings}?archived=true`
      : API_URLS.adminListings;
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },

  // Получение объектов владельца
  getOwnerListings: async (token: string, ownerId: number) => {
    const response = await fetch(`${API_URLS.ownerListings}?owner_id=${ownerId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },

  // Создание объекта
  createListing: async (token: string, data: any) => {
    const response = await fetch(API_URLS.adminListings, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Обновление объекта
  updateListing: async (token: string, id: number, data: any) => {
    const response = await fetch(`${API_URLS.adminListings}?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Архивация объекта
  archiveListing: async (token: string, id: number) => {
    const response = await fetch(`${API_URLS.adminListings}?id=${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },

  // Загрузка фото
  uploadPhoto: async (token: string, imageBase64: string, contentType: string) => {
    const response = await fetch(API_URLS.adminUpload, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ image: imageBase64, contentType }),
    });
    return response.json();
  },

  // Публичное получение объектов
  getPublicListings: async () => {
    const response = await fetch(API_URLS.publicListings);
    return response.json();
  },

  // === Owner API ===
  ownerRegister: async (email: string, password: string, full_name: string, phone: string) => {
    const response = await fetch(API_URLS.ownerAuth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', email, password, full_name, phone }),
    });
    return response.json();
  },

  ownerLogin: async (login: string, password: string) => {
    const response = await fetch(API_URLS.ownerAuth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', login, password }),
    });
    return response.json();
  },

  // Аукцион
  getAuctionInfo: async (city: string) => {
    const response = await fetch(`${API_URLS.auction}?city=${encodeURIComponent(city)}`);
    return response.json();
  },

  placeBid: async (token: string, owner_id: number, listing_id: number, city: string, target_position: number) => {
    const response = await fetch(API_URLS.auction, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'place_bid', owner_id, listing_id, city, target_position }),
    });
    return response.json();
  },

  // Статистика
  trackView: async (listing_id: number) => {
    await fetch(API_URLS.statistics, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'view', listing_id }),
    });
  },

  trackClick: async (listing_id: number, click_type: 'phone' | 'telegram' | 'general' = 'general') => {
    await fetch(API_URLS.statistics, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'click', listing_id, click_type }),
    });
  },

  getStatistics: async (listing_id: number, days: number = 30) => {
    const response = await fetch(`${API_URLS.statistics}?listing_id=${listing_id}&days=${days}`);
    return response.json();
  },

  // Платежи
  createPayment: async (owner_id: number, amount: number) => {
    const response = await fetch(API_URLS.payment, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_payment', owner_id, amount }),
    });
    return response.json();
  },

  // Транзакции
  getOwnerTransactions: async (token: string, owner_id: number, limit: number = 50) => {
    const response = await fetch(`${API_URLS.ownerTransactions}?owner_id=${owner_id}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },

  // Управление владельцами (админ)
  getOwners: async (token: string) => {
    const response = await fetch(API_URLS.adminOwners, {
      headers: { 'X-Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  createOwner: async (token: string, data: any) => {
    const response = await fetch(API_URLS.adminOwners, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  updateOwner: async (token: string, data: any) => {
    const response = await fetch(API_URLS.adminOwners, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  // Восстановление пароля владельцев
  requestPasswordRecovery: async (identifier: string) => {
    const response = await fetch(API_URLS.ownerPasswordRecovery, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request', identifier }),
    });
    return response.json();
  },

  verifyRecoveryToken: async (token: string) => {
    const response = await fetch(API_URLS.ownerPasswordRecovery, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', token }),
    });
    return response.json();
  },

  // Архивация владельцев
  archiveOwner: async (token: string, id: number) => {
    const response = await fetch(API_URLS.adminOwners, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  // Получение отелей для привязки
  getAvailableListings: async (token: string) => {
    const response = await fetch(API_URLS.ownerListings, {
      headers: { 'X-Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  // Привязка отеля к владельцу
  assignListingToOwner: async (token: string, listing_id: number, owner_id: number | null) => {
    const response = await fetch(API_URLS.ownerListings, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ listing_id, owner_id }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  },
};