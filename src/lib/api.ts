const API_URLS = {
  adminAuth: 'https://functions.poehali.dev/f446518c-113b-41ed-8bdc-17ef6babda08',
  adminListings: 'https://functions.poehali.dev/5dea57de-4652-4870-b39f-6b34e594bc21',
  adminUpload: 'https://functions.poehali.dev/22c1da70-b8a6-4b5e-81b8-330b559a8943',
  adminOwners: 'https://functions.poehali.dev/25475092-b74f-493d-a43c-082847302085',
  adminEmployees: 'https://functions.poehali.dev/ca59381a-030d-421c-8c98-057bb7ae12e4',
  employeeBonuses: 'https://functions.poehali.dev/e7b4566b-8aa8-4db2-a866-4ba2231208a3',
  ownerListings: 'https://functions.poehali.dev/f431775b-031f-4417-b3eb-9e0475119162',
  ownerUpdateListing: 'https://functions.poehali.dev/3e708f67-7174-4fd3-84a6-6541bcc2186b',
  publicListings: 'https://functions.poehali.dev/38a2f104-026e-40ea-80dc-0c07c014f868',
  ownerAuth: 'https://functions.poehali.dev/381f57fd-5365-49e9-bb38-088d8db34102',
  ownerPasswordRecovery: 'https://functions.poehali.dev/e8d34dd8-8e0d-4d25-b36b-499898e019c7',
  auction: 'https://functions.poehali.dev/8e5ad1a2-e9bb-462c-baba-212ad26ae9a7',
  statistics: 'https://functions.poehali.dev/0b408e53-8bd4-4f19-a1b5-9403bb03cffd',
  payment: 'https://functions.poehali.dev/d3177c56-4fe4-4a52-a878-e17cca7a1397',
  ownerTransactions: 'https://functions.poehali.dev/d65e7c1b-75b3-4a33-965b-70ee3a543a50',
  subscription: 'https://functions.poehali.dev/083c2fbe-03b3-474d-accd-281d4089bb06',
  detectCity: 'https://functions.poehali.dev/15d3dd6b-83e0-48c3-b215-802340270720',
};

export const api = {
  // Авторизация
  login: async (login: string, password: string) => {
    try {
      console.log('[API] Отправка запроса авторизации...');
      const response = await fetch(API_URLS.adminAuth, {
        method: 'POST',
        mode: 'cors',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email: login, password }),
      });
      
      console.log('[API] Получен ответ:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[API] Успешная авторизация');
      return data;
    } catch (error: any) {
      console.error('[API] Ошибка входа:', error);
      throw error;
    }
  },

  // Получение списка объектов (для админа)  
  getListings: async (token: string, showArchived = false, limit = 1000, offset = 0) => {
    console.log(`[API] getListings called with: token=${!!token}, archived=${showArchived}, limit=${limit}, offset=${offset}`);
    const url = showArchived 
      ? `${API_URLS.adminListings}?archived=true&limit=${limit}&offset=${offset}`
      : `${API_URLS.adminListings}?limit=${limit}&offset=${offset}`;
    
    console.log(`[API] Fetching listings URL: ${url}`);
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`[API] Received ${Array.isArray(data) ? data.length : 0} listings`);
    
    return data;
  },

  // Получение ОДНОГО объекта с полными данными (для редактирования)
  getListing: async (token: string, id: number) => {
    console.log(`[API] getListing called for id=${id}`);
    const response = await fetch(`${API_URLS.adminListings}?id=${id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`[API] Received listing with ${data.rooms?.length || 0} rooms`);
    
    return data;
  },

  // Получение объектов владельца
  getOwnerListings: async (token: string, ownerId: number) => {
    const response = await fetch(`${API_URLS.ownerListings}?owner_id=${ownerId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },

  // Получение объектов на модерации
  getPendingModerationListings: async (token: string, moderationStatus: 'pending' | 'awaiting_recheck' | 'rejected' = 'pending') => {
    const response = await fetch(`${API_URLS.adminListings}?moderation=${moderationStatus}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
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

  // Обновление экспертной оценки
  updateExpertRating: async (token: string, id: number, data: { expert_fullness_rating: number; expert_fullness_feedback: string }) => {
    const response = await fetch(`${API_URLS.adminListings}?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  // Обновление всех экспертных оценок (объект + номера)
  updateListingExpertRatings: async (token: string, id: number, data: any) => {
    const response = await fetch(`${API_URLS.adminListings}?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  // Отправка на повторную проверку
  submitListingForRecheck: async (token: string, id: number) => {
    const response = await fetch(`${API_URLS.adminListings}?id=${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'submit_for_recheck' }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
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

  // Полное удаление объекта (только для superadmin)
  deleteListing: async (token: string, id: number) => {
    const response = await fetch(`${API_URLS.adminListings}?id=${id}&permanent=true`, {
      method: 'DELETE',
      headers: { 'X-Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  // Восстановление объекта из архива
  unarchiveListing: async (token: string, listingId: number) => {
    const response = await fetch(`${API_URLS.adminListings}?id=${listingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ is_archived: false }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  // Загрузка фото
  uploadPhoto: async (token: string, imageBase64: string, contentType: string) => {
    console.log('[API] Uploading photo...');
    console.log('[API] URL:', API_URLS.adminUpload);
    console.log('[API] Content-Type:', contentType);
    console.log('[API] Base64 length:', imageBase64.length);
    
    const response = await fetch(API_URLS.adminUpload, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ image: imageBase64, contentType }),
    });
    
    console.log('[API] Response status:', response.status);
    console.log('[API] Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      console.error('[API] Upload failed:', errorData);
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    const result = await response.json();
    console.log('[API] Upload result:', result);
    return result;
  },

  // Получение деталей номера с фотографиями
  getRoomDetails: async (listingId: number, roomIndex: number) => {
    const response = await fetch(`${API_URLS.publicListings}?listing_id=${listingId}&room_index=${roomIndex}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  // Публичное получение объектов
  getPublicListings: async () => {
    const response = await fetch(API_URLS.publicListings);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
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
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
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

  // Установка подписки администратором
  adminSetSubscription: async (token: string, listingId: number, days: number) => {
    const response = await fetch(API_URLS.subscription, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        action: 'admin_set_subscription',
        listing_id: listingId,
        days
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  // Обновление объекта владельцем
  ownerUpdateListing: async (token: string, listingId: number, data: any) => {
    const response = await fetch(API_URLS.ownerUpdateListing, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ listing_id: listingId, ...data }),
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

  // Подписка
  getSubscriptionInfo: async (listingId: number) => {
    const response = await fetch(`${API_URLS.subscription}?listing_id=${listingId}`);
    return response.json();
  },

  extendSubscription: async (token: string, ownerId: number, listingId: number, days: number) => {
    const response = await fetch(API_URLS.subscription, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'extend_subscription', owner_id: ownerId, listing_id: listingId, days }),
    });
    return response.json();
  },

  adminSetSubscription: async (token: string, listingId: number, days: number) => {
    const response = await fetch(API_URLS.subscription, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'admin_set_subscription', listing_id: listingId, days }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  // Определение города по IP
  detectCity: async () => {
    try {
      const response = await fetch(API_URLS.detectCity);
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error('City detection error:', error);
      return null;
    }
  },

  adminAddBonus: async (token: string, ownerId: number, amount: number) => {
    const response = await fetch(API_URLS.adminOwners, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'add_bonus', owner_id: ownerId, amount }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  updateListingPosition: async (token: string, listingId: number, newPosition: number) => {
    const response = await fetch(API_URLS.adminListings, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'update_position', listing_id: listingId, position: newPosition }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  submitForModeration: async (token: string, listingId: number) => {
    const response = await fetch(API_URLS.adminListings, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'submit_for_moderation', listing_id: listingId }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  moderateListing: async (token: string, listingId: number, status: string, comment: string) => {
    const response = await fetch(API_URLS.adminListings, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'moderate', listing_id: listingId, status, comment }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  getPendingModerationListings: async (token: string) => {
    const response = await fetch(`${API_URLS.adminListings}?moderation=pending`, {
      headers: { 'X-Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  // Управление сотрудниками
  getEmployees: async (token: string) => {
    const response = await fetch(API_URLS.adminEmployees, {
      headers: { 'X-Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  getEmployeeDetails: async (token: string, employeeId: number) => {
    const response = await fetch(`${API_URLS.adminEmployees}?employee_id=${employeeId}`, {
      headers: { 'X-Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  createEmployee: async (token: string, data: any) => {
    const response = await fetch(API_URLS.adminEmployees, {
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

  updateEmployee: async (token: string, id: number, data: any) => {
    const response = await fetch(API_URLS.adminEmployees, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ id, ...data }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  deleteEmployee: async (token: string, id: number) => {
    const response = await fetch(`${API_URLS.adminEmployees}?id=${id}`, {
      method: 'DELETE',
      headers: {
        'X-Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  // Управление бонусами сотрудников
  getBonusStats: async (token: string) => {
    const response = await fetch(API_URLS.employeeBonuses, {
      headers: { 'X-Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  getEmployeeBonuses: async (token: string, adminId: number, showPaid = false) => {
    const url = `${API_URLS.employeeBonuses}?admin_id=${adminId}${showPaid ? '&paid=true' : ''}`;
    const response = await fetch(url, {
      headers: { 'X-Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  markBonusesPaid: async (token: string, bonusIds: number[]) => {
    const response = await fetch(API_URLS.employeeBonuses, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'mark_paid', bonus_ids: bonusIds }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  markBonusesUnpaid: async (token: string, bonusIds: number[]) => {
    const response = await fetch(API_URLS.employeeBonuses, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'mark_unpaid', bonus_ids: bonusIds }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  },
};