import { useState, useCallback } from 'react';
import shareService from '../services/shareService';

/**
 * Custom hook for sharing functionality
 * @param {Object} options - Hook options
 * @returns {Object} Share hook methods and state
 */
export const useShare = (options = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shareResult, setShareResult] = useState(null);

  /**
   * Create a share
   * @param {Object} shareData - Data to share
   * @param {Object} shareOptions - Sharing options
   * @returns {Promise<Object>} Share result
   */
  const createShare = useCallback(async (shareData, shareOptions = {}) => {
    setIsLoading(true);
    setError(null);
    setShareResult(null);

    try {
      const result = await shareService.createShare(shareData, shareOptions);
      setShareResult(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Share research content
   * @param {Object} researchData - Research data
   * @param {Object} shareOptions - Sharing options
   * @returns {Promise<Object>} Share result
   */
  const shareResearch = useCallback(async (researchData, shareOptions = {}) => {
    setIsLoading(true);
    setError(null);
    setShareResult(null);

    try {
      const result = await shareService.shareResearch(researchData, shareOptions);
      setShareResult(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Share chat content
   * @param {Object} chatData - Chat data
   * @param {Object} shareOptions - Sharing options
   * @returns {Promise<Object>} Share result
   */
  const shareChat = useCallback(async (chatData, shareOptions = {}) => {
    setIsLoading(true);
    setError(null);
    setShareResult(null);

    try {
      const result = await shareService.shareChat(chatData, shareOptions);
      setShareResult(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Share document content
   * @param {Object} documentData - Document data
   * @param {Object} shareOptions - Sharing options
   * @returns {Promise<Object>} Share result
   */
  const shareDocument = useCallback(async (documentData, shareOptions = {}) => {
    setIsLoading(true);
    setError(null);
    setShareResult(null);

    try {
      const result = await shareService.shareDocument(documentData, shareOptions);
      setShareResult(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Copy share URL to clipboard
   * @param {String} shareUrl - Share URL
   * @returns {Promise<Boolean>} Success status
   */
  const copyToClipboard = useCallback(async (shareUrl) => {
    try {
      const success = await shareService.copyToClipboard(shareUrl);
      if (!success) {
        setError('Failed to copy to clipboard');
      }
      return success;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  /**
   * Get share by ID
   * @param {String} shareId - Share ID
   * @returns {Promise<Object>} Share data
   */
  const getShare = useCallback(async (shareId) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await shareService.getShare(shareId);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update share
   * @param {String} shareId - Share ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated share
   */
  const updateShare = useCallback(async (shareId, updateData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await shareService.updateShare(shareId, updateData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Delete share
   * @param {String} shareId - Share ID
   * @returns {Promise<Boolean>} Success status
   */
  const deleteShare = useCallback(async (shareId) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await shareService.deleteShare(shareId);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear share result
   */
  const clearResult = useCallback(() => {
    setShareResult(null);
  }, []);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setShareResult(null);
  }, []);

  return {
    // State
    isLoading,
    error,
    shareResult,
    
    // Methods
    createShare,
    shareResearch,
    shareChat,
    shareDocument,
    copyToClipboard,
    getShare,
    updateShare,
    deleteShare,
    
    // Utility methods
    clearError,
    clearResult,
    reset
  };
};

export default useShare;
