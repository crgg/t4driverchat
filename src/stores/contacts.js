/**
 * Contacts Store
 * Manages drivers and carriers lists
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { chatApi } from '@/services/api';
import { useChatStore } from './chat';
import driversData from '@/fakeData/drivers.json';

export const useContactsStore = defineStore('contacts', () => {
  // State
  const drivers = ref([]);
  const carriers = ref([]);
  const filteredDrivers = ref([]);
  const filteredCarriers = ref([]);
  const filterBy = ref('driver'); // 'driver' or 'carrier'
  const searchValue = ref('');
  const isSearching = ref(false);
  const loading = ref(false);
  const usersConnected = ref([]);
  const terminalZones = ref(new Set());
  const otherCodes = ref(new Set());
  const terminalZoneFilters = ref([]);
  const otherCodeFilters = ref([]);
  const selectedContacts = ref(new Map());

  // Getters
  const hasActiveFilters = computed(() => {
    return (
      searchValue.value.length > 0 ||
      terminalZoneFilters.value.length > 0 ||
      otherCodeFilters.value.length > 0
    );
  });

  const currentContacts = computed(() => {
    const chatStore = useChatStore();
    const { lastMessages, sessionDrivers } = chatStore;

    // Get base list based on filter - use filtered lists if any filters are active
    let list = [];
    if (filterBy.value === 'driver') {
      list = hasActiveFilters.value ? filteredDrivers.value : drivers.value;
    } else {
      list = hasActiveFilters.value ? filteredCarriers.value : carriers.value;
    }

    // Separate contacts with and without messages
    const listWithMessages = [];
    const listWithoutMessages = [];

    for (const contact of list) {
      const sessionId = sessionDrivers.get(contact.DRIVER_ID);
      const lastMessage = sessionId ? lastMessages.get(sessionId) : null;

      if (lastMessage) {
        listWithMessages.push({
          ...contact,
          session: { id: sessionId },
          lastMessage: lastMessage,
        });
      } else {
        listWithoutMessages.push({
          ...contact,
          session: sessionId ? { id: sessionId } : null,
          lastMessage: undefined,
        });
      }
    }

    // Sort contacts with messages by message ID (most recent first)
    listWithMessages.sort((a, b) => {
      if (b.lastMessage && a.lastMessage) {
        return b.lastMessage.id - a.lastMessage.id;
      }
      return 0;
    });

    // Return contacts with messages first, then without messages
    return [...listWithMessages, ...listWithoutMessages];
  });

  const activeFiltersCount = computed(() => {
    return terminalZoneFilters.value.length + otherCodeFilters.value.length;
  });

  const isContactOnline = computed(() => (driverId) => {
    return usersConnected.value.some((user) => user.username === driverId);
  });

  // Actions

  /**
   * Load drivers list
   * @param {string} search
   */
  const loadDrivers = async (search = '') => {
    search;
    loading.value = true;

    try {
      // const response = await chatApi.getDrivers(search);
      // const data = response.data.data || [];
      const data = driversData;

      // Process data
      const processedData = data.map((driver) => ({
        ...driver,
        NAME: driver.NAME?.trim().replace(/ {2,}/g, ' ') || '',
      }));

      // Extract terminal zones and other codes
      processedData.forEach((driver) => {
        if (driver.TERMINAL_ZONE) terminalZones.value.add(driver.TERMINAL_ZONE);
        if (driver.OTHER_CODE) otherCodes.value.add(driver.OTHER_CODE);
      });

      drivers.value = processedData;

      // Apply filters to initialize filtered lists
      applyFilters();

      return { success: true, data: processedData };
    } catch (error) {
      console.error('Failed to load drivers:', error);
      return { success: false, error };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Load carriers list
   * @param {string} search
   */
  const loadCarriers = async (search = '') => {
    search;
    loading.value = true;

    try {
      // const response = await chatApi.getCarriers(search);
      // const data = response.data.data || [];
      const data = [];

      // Process data
      const processedData = data.map((carrier) => ({
        ...carrier,
        NAME: carrier.NAME?.trim().replace(/ {2,}/g, ' ') || '',
      }));

      carriers.value = processedData;

      // Apply filters to initialize filtered lists
      applyFilters();

      return { success: true, data: processedData };
    } catch (error) {
      console.error('Failed to load carriers:', error);
      return { success: false, error };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Search and filter contacts
   * @param {string} search
   */
  const searchContacts = async (search) => {
    searchValue.value = search;
    isSearching.value = true;

    try {
      // Load both drivers and carriers
      await Promise.all([loadDrivers(search), loadCarriers(search)]);

      // Apply filters
      applyFilters();

      return { success: true };
    } catch (error) {
      console.error('Failed to search contacts:', error);
      return { success: false, error };
    } finally {
      isSearching.value = false;
    }
  };

  /**
   * Apply filters to contacts
   */
  const applyFilters = () => {
    const searchTerm = searchValue.value.toUpperCase();

    // Filter drivers
    filteredDrivers.value = drivers.value.filter((driver) => {
      const matchesSearch =
        driver.DRIVER_ID?.toUpperCase().includes(searchTerm) ||
        driver.NAME?.toUpperCase().includes(searchTerm);

      const matchesTerminalZone =
        terminalZoneFilters.value.length === 0 ||
        terminalZoneFilters.value.includes(driver.TERMINAL_ZONE);

      const matchesOtherCode =
        otherCodeFilters.value.length === 0 || otherCodeFilters.value.includes(driver.OTHER_CODE);

      return matchesSearch && matchesTerminalZone && matchesOtherCode;
    });

    // Filter carriers
    filteredCarriers.value = carriers.value.filter((carrier) => {
      const matchesSearch =
        carrier.DRIVER_ID?.toUpperCase().includes(searchTerm) ||
        carrier.NAME?.toUpperCase().includes(searchTerm);

      const matchesTerminalZone =
        terminalZoneFilters.value.length === 0 ||
        terminalZoneFilters.value.includes(carrier.TERMINAL_ZONE);

      const matchesOtherCode =
        otherCodeFilters.value.length === 0 || otherCodeFilters.value.includes(carrier.OTHER_CODE);

      return matchesSearch && matchesTerminalZone && matchesOtherCode;
    });
  };

  /**
   * Set filter type (driver or carrier)
   * @param {string} type
   */
  const setFilterBy = (type) => {
    filterBy.value = type;
  };

  /**
   * Toggle terminal zone filter
   * @param {string} zone
   */
  const toggleTerminalZoneFilter = (zone) => {
    const index = terminalZoneFilters.value.indexOf(zone);
    if (index > -1) {
      terminalZoneFilters.value.splice(index, 1);
    } else {
      terminalZoneFilters.value.push(zone);
    }
    // Removed auto-apply, must call applyFilters() manually
  };

  /**
   * Toggle other code filter
   * @param {string} code
   */
  const toggleOtherCodeFilter = (code) => {
    const index = otherCodeFilters.value.indexOf(code);
    if (index > -1) {
      otherCodeFilters.value.splice(index, 1);
    } else {
      otherCodeFilters.value.push(code);
    }
    // Removed auto-apply, must call applyFilters() manually
  };

  /**
   * Set filters and apply them
   * @param {Object} filters - { terminalZones: [], otherCodes: [] }
   */
  const setFilters = (filters) => {
    if (filters.terminalZones !== undefined) {
      terminalZoneFilters.value = [...filters.terminalZones];
    }
    if (filters.otherCodes !== undefined) {
      otherCodeFilters.value = [...filters.otherCodes];
    }
    applyFilters();
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    terminalZoneFilters.value = [];
    otherCodeFilters.value = [];
    searchValue.value = '';
    applyFilters();
  };

  /**
   * Set connected users
   * @param {Array} users
   */
  const setConnectedUsers = (users) => {
    usersConnected.value = users;
  };

  /**
   * Add connected user
   * @param {Object} user
   */
  const addConnectedUser = (user) => {
    const exists = usersConnected.value.some((u) => u.username === user.username);
    if (!exists) {
      usersConnected.value.push(user);
    }
  };

  /**
   * Remove connected user
   * @param {string} username
   */
  const removeConnectedUser = (username) => {
    const index = usersConnected.value.findIndex((u) => u.username === username);
    if (index > -1) {
      usersConnected.value.splice(index, 1);
    }
  };

  /**
   * Find contact by ID
   * @param {string} id
   */
  const findContactById = (id) => {
    return [...drivers.value, ...carriers.value].find((contact) => contact.DRIVER_ID === id);
  };

  /**
   * Update last message for a contact
   * @param {number} sessionId
   * @param {Object} message
   * @note: This now updates the chatStore lastMessages Map
   * The currentContacts computed will automatically reflect the change
   */
  const updateLastMessage = (sessionId, message) => {
    const chatStore = useChatStore();
    chatStore.lastMessages.set(sessionId, message);
  };

  /**
   * Remove last message for a contact
   * @param {number} sessionId
   */
  const removeLastMessage = (sessionId) => {
    const chatStore = useChatStore();
    chatStore.lastMessages.delete(sessionId);
  };

  /**
   * Set session for a contact
   * @param {string} driverId
   * @param {number} sessionId
   * @note: This now updates the chatStore sessionDrivers Map
   * The currentContacts computed will automatically reflect the change
   */
  const setContactSession = (driverId, sessionId) => {
    const chatStore = useChatStore();
    chatStore.sessionDrivers.set(driverId, sessionId);
  };

  /**
   * Clear contacts data
   */
  const clearContacts = () => {
    drivers.value = [];
    carriers.value = [];
    filteredDrivers.value = [];
    filteredCarriers.value = [];
    searchValue.value = '';
    usersConnected.value = [];
  };

  // Selected Contacts
  const toggleSelectedContact = (contact, callback) => {
    const exists = selectedContacts.value.has(contact.DRIVER_ID);
    if (exists) {
      selectedContacts.value.delete(contact.DRIVER_ID);
      if (selectedContacts.value.size === 0) {
        callback?.();
      }
    } else {
      selectedContacts.value.set(contact.DRIVER_ID, contact);
    }
  };

  return {
    // State
    drivers,
    carriers,
    filteredDrivers,
    filteredCarriers,
    filterBy,
    searchValue,
    isSearching,
    loading,
    usersConnected,
    terminalZones,
    otherCodes,
    terminalZoneFilters,
    otherCodeFilters,
    // Getters
    currentContacts,
    activeFiltersCount,
    isContactOnline,
    hasActiveFilters,
    selectedContacts,
    // Actions
    loadDrivers,
    loadCarriers,
    searchContacts,
    applyFilters,
    setFilterBy,
    toggleTerminalZoneFilter,
    toggleOtherCodeFilter,
    setFilters,
    clearFilters,
    setConnectedUsers,
    addConnectedUser,
    removeConnectedUser,
    findContactById,
    updateLastMessage,
    removeLastMessage,
    setContactSession,
    clearContacts,
    // Selected Contacts
    toggleSelectedContact,
  };
});
