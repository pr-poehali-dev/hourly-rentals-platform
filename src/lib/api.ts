const API_URLS = {
  adminAuth: 'https://functions.poehali.dev/f446518c-113b-41ed-8bdc-17ef6babda08',
  adminListings: 'https://functions.poehali.dev/5dea57de-4652-4870-b39f-6b34e594bc21',
  adminUpload: 'https://functions.poehali.dev/22c1da70-b8a6-4b5e-81b8-330b559a8943',
  publicListings: 'https://functions.poehali.dev/38a2f104-026e-40ea-80dc-0c07c014f868',
};

export const api = {
  // Авторизация
  login: async (email: string, password: string) => {
    try {
      const response = await fetch(API_URLS.adminAuth, {
        method: 'POST',
        mode: 'cors',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
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

  // Получение списка объектов
  getListings: async (token: string, showArchived = false) => {
    const url = showArchived 
      ? `${API_URLS.adminListings}?archived=true`
      : API_URLS.adminListings;
    
    const response = await fetch(url, {
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
};