const API_URLS = {
  adminAuth: 'https://functions.poehali.dev/f446518c-113b-41ed-8bdc-17ef6babda08',
  adminListings: 'https://functions.poehali.dev/5dea57de-4652-4870-b39f-6b34e594bc21',
  adminUpload: 'https://functions.poehali.dev/22c1da70-b8a6-4b5e-81b8-330b559a8943',
};

export const api = {
  // Авторизация
  login: async (email: string, password: string) => {
    const response = await fetch(API_URLS.adminAuth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
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
};
